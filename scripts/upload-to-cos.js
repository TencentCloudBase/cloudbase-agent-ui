const COS = require("cos-nodejs-sdk-v5");
const path = require("path");
const fs = require("fs");

// 配置信息
const config = {
  SecretId: process.env.TENCENT_SECRET_ID,
  SecretKey: process.env.TENCENT_SECRET_KEY,
  Bucket: "weda-cloud-1258344699",
  Region: "ap-shanghai",
};

const cos = new COS({
  SecretId: config.SecretId,
  SecretKey: config.SecretKey,
});

async function uploadToCOS() {
  try {
    console.log("🔄 开始上传文件到 COS...");

    // 上传小程序示例
    await uploadFile(
      path.join(__dirname, "../apps/miniprogram-agent-ui"),
      "miniprogram-agent-ui.zip",
      "preview/miniprogram-agent-ui.zip"
    );

    console.log("✅ 上传完成");
  } catch (err) {
    console.error("❌ 上传失败:", err);
    process.exit(1);
  }
}

async function uploadFile(sourcePath, zipName, cosKey) {
  // 先压缩文件
  const zipPath = path.join(__dirname, "../temp", zipName);
  await zipDirectory(sourcePath, zipPath);

  // 上传到 COS
  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Key: cosKey,
        Body: fs.createReadStream(zipPath),
        ContentType: "application/zip",
        Domain: "{Bucket}.cos-internal.{Region}.tencentcos.cn",
      },
      function (err, data) {
        // 清理临时文件
        fs.unlinkSync(zipPath);

        if (err) {
          reject(err);
          return;
        }
        console.log(`📦 文件 ${zipName} 上传成功:`, data.Location);
        resolve(data);
      }
    );
  });
}

// 压缩目录
async function zipDirectory(sourceDir, outPath) {
  const archiver = require("archiver");
  const output = fs.createWriteStream(outPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// 确保临时目录存在
if (!fs.existsSync(path.join(__dirname, "../temp"))) {
  fs.mkdirSync(path.join(__dirname, "../temp"));
}

uploadToCOS();
