 // ==========================================
// PHOTO TOOL
// ==========================================


// ELEMENTS
const imageInput = document.getElementById("imageInput");
const uploadBox = document.getElementById("uploadBox");

const preview = document.getElementById("preview");
const editor = document.getElementById("editor");

const widthInput = document.getElementById("width");
const heightInput = document.getElementById("height");

const lockRatio = document.getElementById("lockRatio");
const preset = document.getElementById("preset");

const format = document.getElementById("format");

const targetSize = document.getElementById("targetSize");
const sizeUnit = document.getElementById("sizeUnit");

const processBtn = document.getElementById("processBtn");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");

const originalInfo = document.getElementById("originalInfo");

const result = document.getElementById("result");
const resultInfo = document.getElementById("resultInfo");

const themeSelect = document.getElementById("themeSelect");


// VARIABLES
let originalImage = new Image();
let originalFile = null;
let finalBlob = null;

let aspectRatio = 1;


// ==========================================
// IMAGE UPLOAD
// ==========================================

imageInput.addEventListener("change", () => {

    const file = imageInput.files[0];

    if (file) {
        loadImage(file);
    }
});


function loadImage(file) {

    if (!file.type.startsWith("image/")) {

        alert("Please select a valid image.");

        return;
    }

    originalFile = file;

    const imageURL =
        URL.createObjectURL(file);

    originalImage = new Image();

    originalImage.onload = () => {

        aspectRatio =
            originalImage.width /
            originalImage.height;

        widthInput.value =
            originalImage.width;

        heightInput.value =
            originalImage.height;

        preview.src = imageURL;

        originalInfo.textContent =
            `${originalImage.width} × ${originalImage.height}px • ${formatBytes(file.size)}`;

        editor.classList.remove("hidden");

        result.classList.add("hidden");

        downloadBtn.classList.add("hidden");

        finalBlob = null;

        // Scroll smoothly to editor
        setTimeout(() => {

            editor.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }, 100);
    };

    originalImage.onerror = () => {

        alert("Unable to load this image.");
    };

    originalImage.src = imageURL;
}


// ==========================================
// DRAG & DROP
// ==========================================

uploadBox.addEventListener("dragover", (event) => {

    event.preventDefault();

    uploadBox.classList.add("dragging");
});


uploadBox.addEventListener("dragleave", () => {

    uploadBox.classList.remove("dragging");
});


uploadBox.addEventListener("drop", (event) => {

    event.preventDefault();

    uploadBox.classList.remove("dragging");

    const file =
        event.dataTransfer.files[0];

    if (file) {

        loadImage(file);
    }
});


// ==========================================
// ASPECT RATIO
// ==========================================

widthInput.addEventListener("input", () => {

    if (!lockRatio.checked) {
        return;
    }

    const width =
        Number(widthInput.value);

    if (width > 0) {

        heightInput.value =
            Math.round(
                width / aspectRatio
            );
    }
});


heightInput.addEventListener("input", () => {

    if (!lockRatio.checked) {
        return;
    }

    const height =
        Number(heightInput.value);

    if (height > 0) {

        widthInput.value =
            Math.round(
                height * aspectRatio
            );
    }
});


// ==========================================
// PRESETS
// ==========================================

preset.addEventListener("change", () => {

    switch (preset.value) {

        // India-style common passport photo ratio
        // 35 × 45 mm at 300 DPI ≈ 413 × 531 px
        case "passport":

            widthInput.value = 413;
            heightInput.value = 531;

            lockRatio.checked = false;

            break;


        case "instagram":

            widthInput.value = 1080;
            heightInput.value = 1080;

            lockRatio.checked = false;

            break;


        case "facebook":

            widthInput.value = 1200;
            heightInput.value = 630;

            lockRatio.checked = false;

            break;


        case "youtube":

            widthInput.value = 1280;
            heightInput.value = 720;

            lockRatio.checked = false;

            break;
    }
});


// ==========================================
// PROCESS IMAGE
// ==========================================

processBtn.addEventListener(
    "click",
    async () => {

        if (!originalFile) {

            alert("Please upload an image first.");

            return;
        }


        const width =
            Number(widthInput.value);

        const height =
            Number(heightInput.value);


        if (
            !width ||
            !height ||
            width < 1 ||
            height < 1
        ) {

            alert(
                "Please enter valid width and height."
            );

            return;
        }


        processBtn.disabled = true;

        processBtn.innerHTML =
            "⏳ Processing...";


        try {

            const targetBytes =
                getTargetBytes();


            if (targetBytes) {

                if (
                    format.value ===
                    "image/png"
                ) {

                    finalBlob =
                        await compressPNG(
                            width,
                            height,
                            targetBytes
                        );

                } else {

                    finalBlob =
                        await findBestQuality(
                            width,
                            height,
                            format.value,
                            targetBytes
                        );
                }

            } else {

                finalBlob =
                    await createImageBlob(
                        width,
                        height,
                        format.value,
                        0.92
                    );
            }


            if (!finalBlob) {

                throw new Error(
                    "Image processing failed."
                );
            }


            const finalURL =
                URL.createObjectURL(
                    finalBlob
                );

            preview.src = finalURL;


            resultInfo.textContent =
                `${width} × ${height}px • ${formatBytes(finalBlob.size)}`;


            result.classList.remove(
                "hidden"
            );

            downloadBtn.classList.remove(
                "hidden"
            );


            result.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });


        } catch (error) {

            console.error(error);

            alert(
                "Something went wrong while processing the image."
            );

        } finally {

            processBtn.disabled = false;

            processBtn.innerHTML =
                "<span>⚡</span> Process Image";
        }
    }
);


// ==========================================
// CREATE IMAGE BLOB
// ==========================================

function createImageBlob(
    width,
    height,
    type,
    quality
) {

    return new Promise((resolve, reject) => {

        const canvas =
            document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;


        const ctx =
            canvas.getContext("2d");

        if (!ctx) {

            reject(
                new Error("Canvas unavailable.")
            );

            return;
        }


        // White background for JPG
        if (type === "image/jpeg") {

            ctx.fillStyle = "#ffffff";

            ctx.fillRect(
                0,
                0,
                width,
                height
            );
        }


        // Better image rendering
        ctx.imageSmoothingEnabled = true;

        ctx.imageSmoothingQuality = "high";


        ctx.drawImage(
            originalImage,
            0,
            0,
            width,
            height
        );


        canvas.toBlob(
            (blob) => {

                if (blob) {

                    resolve(blob);

                } else {

                    reject(
                        new Error(
                            "Could not create image."
                        )
                    );
                }

            },
            type,
            quality
        );
    });
}


// ==========================================
// JPG / WEBP TARGET SIZE
// ==========================================

async function findBestQuality(
    width,
    height,
    type,
    targetBytes
) {

    let low = 0.02;
    let high = 1;

    let best = null;


    for (let i = 0; i < 14; i++) {

        const quality =
            (low + high) / 2;


        const blob =
            await createImageBlob(
                width,
                height,
                type,
                quality
            );


        if (
            blob.size <= targetBytes
        ) {

            best = blob;

            low = quality;

        } else {

            high = quality;
        }
    }


    // If target is extremely small,
    // return lowest possible quality.
    if (!best) {

        best =
            await createImageBlob(
                width,
                height,
                type,
                0.02
            );
    }


    return best;
}


// ==========================================
// PNG TARGET SIZE
// ==========================================

async function compressPNG(
    width,
    height,
    targetBytes
) {

    let w = width;
    let h = height;

    let blob = null;


    for (let i = 0; i < 35; i++) {

        blob =
            await createImageBlob(
                Math.max(1, Math.round(w)),
                Math.max(1, Math.round(h)),
                "image/png",
                1
            );


        if (
            blob.size <= targetBytes
        ) {

            return blob;
        }


        w *= 0.9;
        h *= 0.9;


        if (
            w < 20 ||
            h < 20
        ) {

            break;
        }
    }


    return blob;
}


// ==========================================
// TARGET FILE SIZE
// ==========================================

function getTargetBytes() {

    const value =
        Number(targetSize.value);


    if (
        !value ||
        value <= 0
    ) {

        return null;
    }


    if (
        sizeUnit.value === "MB"
    ) {

        return (
            value *
            1024 *
            1024
        );
    }


    return value * 1024;
}


// ==========================================
// DOWNLOAD
// ==========================================

downloadBtn.addEventListener(
    "click",
    () => {

        if (!finalBlob) {

            alert(
                "Please process the image first."
            );

            return;
        }


        let extension = "jpg";


        if (
            format.value ===
            "image/png"
        ) {

            extension = "png";
        }


        if (
            format.value ===
            "image/webp"
        ) {

            extension = "webp";
        }


        const url =
            URL.createObjectURL(
                finalBlob
            );


        const link =
            document.createElement("a");


        link.href = url;

        link.download =
            `phototool-${Date.now()}.${extension}`;


        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);


        setTimeout(() => {

            URL.revokeObjectURL(url);

        }, 1000);
    }
);


// ==========================================
// RESET
// ==========================================

resetBtn.addEventListener(
    "click",
    () => {

        imageInput.value = "";

        originalFile = null;

        finalBlob = null;

        editor.classList.add("hidden");

        result.classList.add("hidden");

        downloadBtn.classList.add("hidden");

        preview.src = "";

        originalInfo.textContent =
            "No image selected";

        preset.value = "";

        targetSize.value = "";

        widthInput.value = "";

        heightInput.value = "";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
);


// ==========================================
// THEME
// ==========================================

const systemTheme =
    window.matchMedia(
        "(prefers-color-scheme: dark)"
    );


function applyTheme(theme) {

    if (theme === "dark") {

        document.body.classList.add("dark");

        return;
    }


    if (theme === "light") {

        document.body.classList.remove("dark");

        return;
    }


    // SYSTEM
    if (systemTheme.matches) {

        document.body.classList.add("dark");

    } else {

        document.body.classList.remove("dark");
    }
}


// Load saved theme
const savedTheme =
    localStorage.getItem(
        "photoToolTheme"
    );


if (savedTheme) {

    themeSelect.value =
        savedTheme;

} else {

    themeSelect.value =
        "system";
}


applyTheme(themeSelect.value);


// Change theme
themeSelect.addEventListener(
    "change",
    () => {

        const theme =
            themeSelect.value;


        localStorage.setItem(
            "photoToolTheme",
            theme
        );


        applyTheme(theme);
    }
);


// Detect system theme change
systemTheme.addEventListener(
    "change",
    () => {

        if (
            themeSelect.value ===
            "system"
        ) {

            applyTheme("system");
        }
    }
);


// ==========================================
// FILE SIZE
// ==========================================

function formatBytes(bytes) {

    if (bytes < 1024) {

        return `${bytes} B`;
    }


    if (
        bytes <
        1024 * 1024
    ) {

        return (
            (bytes / 1024)
                .toFixed(2) +
            " KB"
        );
    }


    return (
        (
            bytes /
            (1024 * 1024)
        ).toFixed(2) +
        " MB"
    );
}