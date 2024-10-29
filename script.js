const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gravity = 0.3; // 重力
const shapes = []; // 落下する形状を格納
let isGameOver = false;
let currentImage = null; // 現在の画像
let currentHitboxes = []; // 画像のエッジヒットボックス

// 形状のクラス
class Shape {
    constructor(image, hitboxes, x, y, size) {
        this.image = image;
        this.hitboxes = hitboxes.map(hb => ({ x: hb.x + x - size / 2, y: hb.y + y - size / 2 }));
        this.x = x;
        this.y = y;
        this.size = size;
        this.dy = 0; // y方向の速度
    }

    draw() {
        ctx.drawImage(this.image, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }

    update() {
        if (!isGameOver) {
            this.dy += gravity;
            this.y += this.dy;

            // 当たり判定の位置を更新
            this.hitboxes.forEach(hitbox => hitbox.y += this.dy);

            // 底にぶつかったら停止
            if (this.y + this.size / 2 >= canvas.height) {
                this.y = canvas.height - this.size / 2;
                this.dy = 0;
                this.addToStack();
            }

            // 他の形状にぶつかったら停止
            for (let shape of shapes) {
                if (shape !== this && this.isColliding(shape)) {
                    this.y -= this.dy;
                    this.dy = 0;
                    this.addToStack();
                    break;
                }
            }
        }
        this.draw();
    }

    isColliding(other) {
        return this.hitboxes.some(hb1 => other.hitboxes.some(hb2 => Math.hypot(hb1.x - hb2.x, hb1.y - hb2.y) < 1));
    }

    addToStack() {
        shapes.push(this);
        checkGameOver();
        if (!isGameOver) {
            document.getElementById('dropButton').disabled = true;
            currentImage = null;
            currentHitboxes = [];
        }
    }
}

// 新しい形状を生成
function spawnShape() {
    if (currentImage && currentHitboxes.length) {
        const size = 60;
        const x = canvas.width / 2;
        const shape = new Shape(currentImage, currentHitboxes, x, size / 2, size);
        shapes.push(shape);
    }
}

// ゲームオーバー判定
function checkGameOver() {
    if (shapes.some(shape => shape.y - shape.size / 2 <= 0)) {
        isGameOver = true;
        alert("ゲームオーバー！");
    }
}

// 更新ループ
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach(shape => shape.update());
    if (!isGameOver) {
        requestAnimationFrame(update);
    }
}

// 初期設定
update();

// ファイルアップロード処理
document.getElementById('imageUploader').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                createHitboxes(img, (hitboxes) => {
                    currentImage = img;
                    currentHitboxes = hitboxes;
                    document.getElementById('dropButton').disabled = false;
                });
            };
        };
        reader.readAsDataURL(file);
    }
});

// クリックで形状を落とす
document.getElementById('dropButton').addEventListener('click', () => {
    if (currentImage && currentHitboxes.length) {
        spawnShape();
    }
});

// ヒットボックス生成関数
function createHitboxes(image, callback) {
    const width = image.width;
    const height = image.height;

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.drawImage(image, 0, 0);

    const imageData = offscreenCtx.getImageData(0, 0, width, height).data;
    const hitboxes = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const alpha = imageData[index + 3];

            if (alpha > 0) {
                let isEdgePixel = false;
                const directions = [
                    { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                    { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                    { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
                    { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
                ];

                for (const { dx, dy } of directions) {
                    const nx = x + dx;
                    const ny = y + dy;

                    if (nx < 0 || ny < 0 || nx >= width || ny >= height ||
                        imageData[(ny * width + nx) * 4 + 3] === 0) {
                        isEdgePixel = true;
                        break;
                    }
                }

                if (isEdgePixel) {
                    hitboxes.push({ x, y });
                }
            }
        }
    }

    callback(hitboxes);
}
