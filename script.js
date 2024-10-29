const canvas = document.getElementById('gameCanvas');

const ctx = canvas.getContext('2d');


const img1 = new Image();

const img2 = new Image();


img1.src = 'sample1.png'; // 画像1のパスを指定

img2.src = 'sample2.png'; // 画像2のパスを指定


let pos1 = { x: 0, y: 200 }; // 画像1の初期位置

let pos2 = { x: 350, y: 200 }; // 画像2の初期位置

const speed = 2; // 移動速度


let hitboxes1 = [];

let hitboxes2 = [];


img1.onload = img2.onload = () => {

    createHitboxes(img1, (boxes) => {

        hitboxes1 = boxes; // 画像1のヒットボックスを保存

    });

    createHitboxes(img2, (boxes) => {

        hitboxes2 = boxes; // 画像2のヒットボックスを保存

    });

    requestAnimationFrame(update);

};


function createHitboxes(image, callback) {

    const width = image.width;

    const height = image.height;


    // オフスクリーンキャンバスを作成

    const offscreenCanvas = document.createElement('canvas');

    offscreenCanvas.width = width;

    offscreenCanvas.height = height;

    const offscreenCtx = offscreenCanvas.getContext('2d');

    offscreenCtx.drawImage(image, 0, 0);


    const imageData = offscreenCtx.getImageData(0, 0, width, height).data;

    const hitboxes = [];


    // エッジピクセルを探すために周囲8方向を調べる

    for (let y = 0; y < height; y++) {

        for (let x = 0; x < width; x++) {

            const index = (y * width + x) * 4;

            const alpha = imageData[index + 3];


            // 透明でないピクセルかどうかチェック

            if (alpha > 0) {

                let isEdgePixel = false;


                // 8方向（上下左右および斜め）の隣接ピクセルをチェック

                const directions = [

                    { dx: -1, dy: 0 },  // 左

                    { dx: 1, dy: 0 },   // 右

                    { dx: 0, dy: -1 },  // 上

                    { dx: 0, dy: 1 },   // 下

                    { dx: -1, dy: -1 }, // 左上

                    { dx: 1, dy: -1 },  // 右上

                    { dx: -1, dy: 1 },  // 左下

                    { dx: 1, dy: 1 }    // 右下

                ];


                for (const { dx, dy } of directions) {

                    const nx = x + dx;

                    const ny = y + dy;


                    // 隣接ピクセルが範囲外か透明であればエッジピクセルと判定

                    if (nx < 0 || ny < 0 || nx >= width || ny >= height ||

                        imageData[(ny * width + nx) * 4 + 3] === 0) {

                        isEdgePixel = true;

                        break;

                    }

                }


                // エッジピクセルならヒットボックスに追加

                if (isEdgePixel) {

                    hitboxes.push({ x, y });

                }

            }

        }

    }


    callback(hitboxes);

}


function update() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);


    // 画像を描画

    ctx.drawImage(img1, pos1.x, pos1.y);

    ctx.drawImage(img2, pos2.x, pos2.y);


    // 当たり判定を示す矩形を描画

    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // 半透明の赤

    hitboxes1.forEach(box => {

        ctx.fillRect(pos1.x + box.x, pos1.y + box.y, 1, 1); // 画像1の当たり判定

    });

    hitboxes2.forEach(box => {

        ctx.fillRect(pos2.x + box.x, pos2.y + box.y, 1, 1); // 画像2の当たり判定

    });


    // 衝突判定

    if (isColliding(hitboxes1, pos1, hitboxes2, pos2)) {

        alert("衝突!");

        return; // アラート後は更新を停止

    }


    // 画像1を右に移動

    pos1.x += speed;

    // 画像2を左に移動

    pos2.x -= speed;


    requestAnimationFrame(update);

}


function isColliding(hitboxes1, pos1, hitboxes2, pos2) {

    for (let box1 of hitboxes1) {

        for (let box2 of hitboxes2) {

            if (

                pos1.x + box1.x < pos2.x + box2.x + 1 &&

                pos1.x + box1.x + 1 > pos2.x + box2.x &&

                pos1.y + box1.y < pos2.y + box2.y + 1 &&

                pos1.y + box1.y + 1 > pos2.y + box2.y

            ) {

                return true; // 衝突が検出された

            }

        }

    }

    return false; // 衝突なし

}
