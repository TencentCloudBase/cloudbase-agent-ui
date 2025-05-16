import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import JSZip from 'jszip';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import './index.scss';

interface ZipModelViewerProps {
  /**
   * ZIP文件的URL链接
   */
  zipUrl: string;
  /**
   * ZIP文件中的OBJ文件名（如果与默认名称不同）
   */
  objFileName?: string;
  /**
   * 组件宽度
   */
  width?: string | number;
  /**
   * 组件高度
   */
  height?: string | number;
  /**
   * 是否显示加载状态
   */
  showLoading?: boolean;
  /**
   * 加载失败时的回调
   */
  onError?: (error: Error) => void;
  /**
   * 加载进度回调
   */
  onProgress?: (progress: number) => void;
}

/**
 * ZIP压缩包3D模型查看器组件
 * 支持下载、解压ZIP文件并加载其中的OBJ模型
 */
export const ZipModelViewer: React.FC<ZipModelViewerProps> = ({
  zipUrl,
  objFileName,
  width = 600,
  height = 600,
  showLoading = true,
  onError,
  onProgress,
}) => {
  console.log('执行');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [textureFiles, setTextureFiles] = useState<Record<string, string>>({});

  // 处理加载错误
  const handleError = (err: Error) => {
    setError(err);
    setLoading(false);
    if (onError) {
      onError(err);
    }
  };

  // 更新进度
  const updateProgress = (value: number) => {
    setProgress(value);
    if (onProgress) {
      onProgress(value);
    }
  };

  // 下载并处理ZIP文件
  useEffect(() => {
    const processZipFile = async () => {
      try {
        setLoading(true);
        updateProgress(0);

        // 下载ZIP文件
        const response = await fetch(zipUrl);
        console.log('response', response);
        if (!response.ok) {
          throw new Error(`下载失败: ${response.status} ${response.statusText}`);
        }

        const zipBlob = await response.blob();
        updateProgress(20);

        // 解压ZIP文件
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(zipBlob, {
          onProgress: (_: any, progress: number) => {
            updateProgress(20 + progress * 30); // 解压进度占30%
          },
        });

        // 查找OBJ文件
        let objFile = null;
        let mtlFile = null;
        const textureFiles: Record<string, string> = {};

        // 如果指定了OBJ文件名，则使用指定的文件名
        if (objFileName) {
          objFile = zipContent.file(objFileName);
        } else {
          // 否则查找第一个.obj文件
          const objFiles = Object.keys(zipContent.files).filter((name) => name.toLowerCase().endsWith('.obj'));
          if (objFiles.length > 0) {
            objFile = zipContent.file(objFiles[0] as string);
          }
        }

        if (!objFile) {
          throw new Error('ZIP文件中未找到OBJ文件');
        }

        // 查找对应的MTL文件
        const finalObjFileName = objFile.name;
        console.log('finalObjFileName', finalObjFileName);
        // const mtlFileName = finalObjFileName.replace('.obj', '.mtl');
        const mtlFileName = 'material.mtl'; // 这里混元返回的 mtl 文件名是 material.mtl
        mtlFile = zipContent.file(mtlFileName);

        // 收集所有纹理文件
        const textureExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.tga'];
        for (const fileName in zipContent.files) {
          const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
          if (textureExtensions.includes(ext)) {
            const file = zipContent.file(fileName);
            if (file) {
              const blob = await file.async('blob');
              const url = URL.createObjectURL(blob);
              textureFiles[fileName] = url;
            }
          }
        }
        console.log('textureFiles', textureFiles);

        updateProgress(60);

        // 读取OBJ文件内容
        const objContent = await objFile.async('text');

        // 读取MTL文件内容（如果存在）
        let mtlContent = null;
        if (mtlFile) {
          mtlContent = await mtlFile.async('text');
          console.log('读取MTL文件内容 mtlContent', mtlContent);
        }

        updateProgress(70);

        // 创建临时URL
        const objBlob = new Blob([objContent], { type: 'text/plain' });
        const objUrl = URL.createObjectURL(objBlob);

        let mtlUrl = null;
        if (mtlContent) {
          const mtlBlob = new Blob([mtlContent], { type: 'text/plain' });
          mtlUrl = URL.createObjectURL(mtlBlob);
          console.log('mtlUrl 临时', mtlUrl);
        }

        updateProgress(80);

        // 加载OBJ模型
        const loader = new OBJLoader();

        // 如果存在MTL文件，先加载材质
        if (mtlUrl) {
          const mtlLoader = new MTLLoader();
          const materials = await new Promise<THREE.MaterialCreator>((resolve, reject) => {
            mtlLoader.load(
              mtlUrl,
              (materials) => {
                console.log('加载材质 materials', materials);
                materials.preload();
                resolve(materials);
              },
              undefined,
              reject,
            );
          });

          loader.setMaterials(materials);
        }

        // 加载OBJ模型
        const loadedModel = await new Promise<THREE.Group>((resolve, reject) => {
          loader.load(objUrl, resolve, undefined, reject);
        });

        console.log('加载OBJ模型 loadedModel', loadedModel);

        // 处理纹理
        loadedModel.traverse((child) => {
          console.log('child', child);
          if (child instanceof THREE.Mesh) {
            if (child.material) {
              console.log('child.material', child.material);
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((mat) => {
                console.log('mat', mat);
                // 只要是 MeshPhongMaterial 或 MeshStandardMaterial 都可以赋值
                if (
                  mat instanceof THREE.MeshPhongMaterial ||
                  mat instanceof THREE.MeshStandardMaterial ||
                  mat instanceof THREE.MeshLambertMaterial
                ) {
                  // 这里直接赋值，无需判断原有 map
                  mat.map = new THREE.TextureLoader().load(textureFiles['material_0.png']);
                  mat.needsUpdate = true;
                }
              });
              // if (Array.isArray(child.material)) {
              //   console.log('child.material 数组', child.material);
              //   child.material.forEach((mat) => {
              //     if (mat.map && mat.map.source && mat.map.source.data) {
              //       const texturePath = mat.map.source.data.src;
              //       const textureFileName = texturePath.split('/').pop();
              //       if (textureFileName && textureFiles[textureFileName]) {
              //         const texture = new THREE.TextureLoader().load(textureFiles[textureFileName]);
              //         mat.map = texture;
              //       }
              //     }
              //   });
              // } else if (child.material.map && child.material.map.source && child.material.map.source.data) {
              //   console.log('child.material 对象', child.material);
              //   const texturePath = child.material.map.source.data.src;
              //   const textureFileName = texturePath.split('/').pop();
              //   if (textureFileName && textureFiles[textureFileName]) {
              //     const texture = new THREE.TextureLoader().load(textureFiles[textureFileName]);
              //     child.material.map = texture;
              //   }
              // }
            }
          }
        });

        setModel(loadedModel);
        setTextureFiles(textureFiles);
        updateProgress(100);
        setLoading(false);

        // 清理临时URL
        URL.revokeObjectURL(objUrl);
        if (mtlUrl) {
          URL.revokeObjectURL(mtlUrl);
        }
      } catch (err) {
        handleError(err as Error);
      }
    };

    processZipFile();

    // 清理函数
    return () => {
      // 清理所有创建的纹理URL
      Object.values(textureFiles).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  return (
    <>
      <div
        className="zip-model-viewer-container"
        style={{
          width,
          height,
          position: 'relative',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        {loading && showLoading && (
          <div className="zip-model-viewer-loading">
            <div className="loading-spinner"></div>
            <span>加载中... {Math.round(progress)}%</span>
          </div>
        )}

        {error && (
          <div className="zip-model-viewer-error">
            <span>加载失败: {error.message}</span>
          </div>
        )}

        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} onCreated={() => {}}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />

          {model && <Model model={model} />}

          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        </Canvas>
      </div>
    </>
  );
};

// 模型组件
const Model: React.FC<{ model: THREE.Group }> = ({ model }) => {
  const modelRef = useRef<THREE.Group>();
  const { camera } = useThree();

  // 自动调整相机位置以适应模型大小
  useEffect(() => {
    if (modelRef.current) {
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));

      // 设置相机位置
      camera.position.set(center.x, center.y, center.z + cameraZ * 1.5);
      camera.lookAt(center);

      // 更新控制器
      camera.updateProjectionMatrix();
    }
  }, [model, camera]);

  return <primitive ref={modelRef} object={model} dispose={null} />;
};

export default ZipModelViewer;
