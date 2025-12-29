import React, { useState, useRef, useEffect } from 'react';
import { Camera as CameraIcon, X, CheckCircle, Droplet, Tag, Scissors, Trash2, RotateCcw, Loader2, ImagePlus, ArrowLeft, Leaf, SwitchCamera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useApp } from '../contexts/AppContext';
import { recognizeRecyclingItem, RecyclingItem } from '../services/aiService';

const iconMap: Record<string, any> = { Droplet, Tag, Scissors, Trash2 };

interface CameraProps {
  onBack?: () => void;
}

export default function Camera({ onBack }: CameraProps) {
  const { t } = useLanguage();
  const { recordRecycling } = useApp();
  
  // States
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RecyclingItem | null>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weight, setWeight] = useState('0.5');
  const [showSuccess, setShowSuccess] = useState(false);
  const [useFrontCamera, setUseFrontCamera] = useState(false);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Khởi động camera khi mount
  useEffect(() => {
    initCamera();
    return () => stopCamera();
  }, [useFrontCamera]);

  const initCamera = async () => {
    setCameraError('');
    setCameraReady(false);
    
    // Dừng stream cũ
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      // Thử getUserMedia
      const constraints = {
        video: {
          facingMode: useFrontCamera ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Đợi video sẵn sàng
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setCameraReady(true);
          }).catch(err => {
            console.error('Video play error:', err);
            setCameraError('Không thể phát video camera');
          });
        };
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      // Không hiện lỗi, để user có thể dùng nút chụp native
      setCameraError('native');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  // Chụp ảnh từ video stream
  const captureFromVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Flip nếu camera trước
      if (useFrontCamera) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      stopCamera();
      analyzeWithAI(imageData);
    }
  };

  // Chụp từ camera native (fallback cho mobile)
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageData = ev.target?.result as string;
      setCapturedImage(imageData);
      stopCamera();
      analyzeWithAI(imageData);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  };

  // Chọn ảnh từ thư viện
  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageData = ev.target?.result as string;
      setCapturedImage(imageData);
      stopCamera();
      analyzeWithAI(imageData);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  };

  // Phân tích bằng AI
  const analyzeWithAI = async (imageData: string) => {
    setIsAnalyzing(true);
    setResult(null);
    
    try {
      // Lấy base64 data (bỏ prefix data:image/...)
      const base64 = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      console.log('📤 Gửi ảnh tới AI, độ dài:', base64.length);
      
      const item = await recognizeRecyclingItem(base64);
      console.log('📥 Kết quả từ AI:', item);
      setResult(item);
    } catch (error) {
      console.error('❌ AI Error:', error);
      // Hiển thị kết quả lỗi
      setResult({
        name: t('camera.errorAnalysis'),
        category: 'other',
        categoryColor: 'gray',
        confidence: 0,
        steps: [
          { icon: 'Trash2', text: t('camera.tryAgain'), description: t('camera.tryAgainDesc') },
        ],
        points: 0,
        co2Reduction: 0,
        binType: t('camera.unknown'),
        reason: t('camera.cannotConnect')
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset
  const handleReset = () => {
    setCapturedImage(null);
    setResult(null);
    setWeight('0.5');
    initCamera();
  };

  // Chuyển camera
  const switchCamera = () => {
    setUseFrontCamera(!useFrontCamera);
  };

  // Hoàn thành
  const handleComplete = () => {
    if (!result) return;
    const w = parseFloat(weight) || 0.5;
    
    recordRecycling({
      itemName: result.name,
      category: result.category,
      weight: w,
      points: Math.round(result.points * w),
      co2Saved: result.co2Reduction * w,
    });
    
    setShowWeightModal(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      onBack?.();
    }, 2000);
  };

  const categoryColors: Record<string, { bg: string; text: string; badge: string }> = {
    blue: { bg: '#EFF6FF', text: '#1D4ED8', badge: '#DBEAFE' },
    green: { bg: '#F0FDF4', text: '#15803D', badge: '#DCFCE7' },
    red: { bg: '#FEF2F2', text: '#B91C1C', badge: '#FEE2E2' },
    gray: { bg: '#F9FAFB', text: '#374151', badge: '#F3F4F6' },
  };
  
  const color = categoryColors[result?.categoryColor || 'blue'];

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      backgroundColor: '#000', 
      display: 'flex', 
      flexDirection: 'column',
      zIndex: 50 
    }}>
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleSelectImage}
        style={{ display: 'none' }}
      />
      {/* Camera input cho mobile - mở camera native */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        style={{ display: 'none' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '16px',
        backgroundColor: 'rgba(0,0,0,0.5)',
        position: 'relative',
        zIndex: 10
      }}>
        <button 
          onClick={onBack}
          style={{ 
            width: 44, height: 44, 
            borderRadius: '50%', 
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft color="white" size={24} />
        </button>
        <h1 style={{ color: 'white', fontSize: 18, fontWeight: 600, margin: 0 }}>
          {t('camera.title')}
        </h1>
        {/* Switch camera button */}
        {cameraReady && !capturedImage && (
          <button 
            onClick={switchCamera}
            style={{ 
              width: 44, height: 44, 
              borderRadius: '50%', 
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <SwitchCamera color="white" size={20} />
          </button>
        )}
        {(!cameraReady || capturedImage) && <div style={{ width: 44 }} />}
      </div>

      {/* Camera View */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Video stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            display: cameraReady && !capturedImage ? 'block' : 'none',
            transform: useFrontCamera ? 'scaleX(-1)' : 'none'
          }}
        />
        
        {/* Captured Image */}
        {capturedImage && (
          <img 
            src={capturedImage} 
            alt="Captured"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        
        {/* Loading camera */}
        {!cameraReady && !capturedImage && cameraError !== 'native' && (
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <Loader2 size={40} color="#4ADE80" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'white', marginTop: 12 }}>{t('camera.loadingCamera')}</p>
          </div>
        )}
        
        {/* Native camera mode - hiển thị khi getUserMedia không hoạt động */}
        {cameraError === 'native' && !capturedImage && (
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            padding: 24,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8))'
          }}>
            <div style={{ 
              width: 100, height: 100, 
              borderRadius: '50%', 
              backgroundColor: 'rgba(34,197,94,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20
            }}>
              <CameraIcon size={50} color="#4ADE80" />
            </div>
            <p style={{ color: 'white', textAlign: 'center', marginBottom: 8, fontSize: 18, fontWeight: 600 }}>
              {t('camera.takePhoto')}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 24, fontSize: 14 }}>
              {t('camera.pressBelow')}
            </p>
          </div>
        )}
        
        {/* Scan Frame - chỉ hiện khi camera web hoạt động */}
        {cameraReady && !capturedImage && (
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{ width: 250, height: 250, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTop: '4px solid #4ADE80', borderLeft: '4px solid #4ADE80', borderRadius: '12px 0 0 0' }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTop: '4px solid #4ADE80', borderRight: '4px solid #4ADE80', borderRadius: '0 12px 0 0' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottom: '4px solid #4ADE80', borderLeft: '4px solid #4ADE80', borderRadius: '0 0 0 12px' }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottom: '4px solid #4ADE80', borderRight: '4px solid #4ADE80', borderRadius: '0 0 12px 0' }} />
            </div>
            <p style={{ 
              position: 'absolute', 
              bottom: 100, 
              left: 0, right: 0, 
              textAlign: 'center', 
              color: 'white',
              fontSize: 14,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              {t('camera.placeItem')}
            </p>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      {!capturedImage && (
        <div style={{ 
          padding: '24px',
          backgroundColor: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32
        }}>
          {/* Nút chọn ảnh từ thư viện */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 56, height: 56,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ImagePlus size={24} color="white" />
          </button>
          
          {/* Nút chụp chính */}
          <button
            onClick={cameraReady ? captureFromVideo : () => cameraInputRef.current?.click()}
            style={{
              width: 80, height: 80,
              borderRadius: '50%',
              backgroundColor: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: 64, height: 64,
              borderRadius: '50%',
              border: '4px solid #22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CameraIcon size={32} color="#16A34A" />
            </div>
          </button>
          
          <div style={{ width: 56 }} />
        </div>
      )}

      {/* Result Panel */}
      <AnimatePresence>
        {capturedImage && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderRadius: '24px 24px 0 0',
              maxHeight: '70%',
              overflow: 'auto'
            }}
          >
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #E5E7EB',
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              zIndex: 10
            }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{t('camera.result')}</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleReset} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
                  <RotateCcw size={20} />
                </button>
                <button onClick={() => { handleReset(); onBack?.(); }} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ padding: 20 }}>
              {/* Loading */}
              {isAnalyzing && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ position: 'relative', width: 60, height: 60, margin: '0 auto 16px' }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        border: '4px solid transparent',
                        borderTopColor: '#22C55E',
                        borderRadius: '50%'
                      }}
                    />
                    <Leaf size={24} color="#22C55E" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                  </div>
                  <p style={{ color: '#6B7280' }}>{t('camera.analyzing')}</p>
                </div>
              )}

              {/* Result */}
              {!isAnalyzing && result && (
                <>
                  {/* Item Card */}
                  <div style={{ backgroundColor: color.bg, borderRadius: 16, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ 
                          backgroundColor: color.badge, 
                          color: color.text,
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500
                        }}>
                          {t(`camera.category.${result.category}`)}
                        </span>
                        <h3 style={{ margin: '8px 0 4px', color: color.text, fontWeight: 600 }}>{result.name}</h3>
                        <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>{result.binType}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, color: '#9CA3AF', fontSize: 12 }}>{t('camera.accuracy')}</p>
                        <p style={{ margin: 0, color: color.text, fontWeight: 700, fontSize: 20 }}>{result.confidence}%</p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                      <div>
                        <p style={{ margin: 0, color: '#6B7280', fontSize: 12 }}>{t('common.points')}</p>
                        <p style={{ margin: 0, color: '#16A34A', fontWeight: 600 }}>+{result.points}P</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, color: '#6B7280', fontSize: 12 }}>{t('camera.co2Saved')}</p>
                        <p style={{ margin: 0, color: '#16A34A', fontWeight: 600 }}>{result.co2Reduction}kg</p>
                      </div>
                    </div>
                  </div>

                  {/* Steps */}
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontWeight: 600 }}>{t('camera.howTo')}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {result.steps.map((step, i) => {
                        const Icon = iconMap[step.icon] || Droplet;
                        return (
                          <div key={i} style={{ display: 'flex', gap: 12, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 }}>
                            <div style={{ 
                              width: 40, height: 40, 
                              borderRadius: '50%', 
                              backgroundColor: '#DCFCE7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Icon size={20} color="#16A34A" />
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{step.text}</p>
                              <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 13 }}>{step.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Complete Button */}
                  <button
                    onClick={() => setShowWeightModal(true)}
                    style={{
                      width: '100%',
                      padding: 16,
                      backgroundColor: '#22C55E',
                      color: 'white',
                      border: 'none',
                      borderRadius: 12,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {t('camera.complete')}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weight Modal */}
      <AnimatePresence>
        {showWeightModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              zIndex: 100
            }}
            onClick={() => setShowWeightModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              style={{
                backgroundColor: 'white',
                borderRadius: 20,
                padding: 24,
                width: '100%',
                maxWidth: 340
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>{t('camera.weightInput')}</h3>
              <p style={{ margin: '0 0 16px', color: '#6B7280' }}>{t('camera.enterWeight')}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  style={{
                    flex: 1,
                    fontSize: 28,
                    fontWeight: 700,
                    textAlign: 'center',
                    padding: 12,
                    border: '2px solid #E5E7EB',
                    borderRadius: 12,
                    outline: 'none'
                  }}
                  step="0.1"
                  min="0.1"
                />
                <span style={{ fontSize: 18, fontWeight: 600, color: '#9CA3AF' }}>kg</span>
              </div>
              
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {['0.5', '1.0', '2.0', '5.0'].map(w => (
                  <button
                    key={w}
                    onClick={() => setWeight(w)}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      borderRadius: 10,
                      border: 'none',
                      fontWeight: 500,
                      cursor: 'pointer',
                      backgroundColor: weight === w ? '#22C55E' : '#F3F4F6',
                      color: weight === w ? 'white' : '#374151'
                    }}
                  >
                    {w}
                  </button>
                ))}
              </div>
              
              {result && (
                <div style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginBottom: 16, textAlign: 'center' }}>
                  <p style={{ margin: 0, color: '#15803D', fontSize: 14 }}>{t('camera.pointsEarned')}</p>
                  <p style={{ margin: '4px 0 0', color: '#16A34A', fontSize: 24, fontWeight: 700 }}>
                    +{Math.round(result.points * (parseFloat(weight) || 0.5))} {t('common.points')}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setShowWeightModal(false)}
                  style={{
                    flex: 1,
                    padding: 14,
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleComplete}
                  style={{
                    flex: 1,
                    padding: 14,
                    backgroundColor: '#22C55E',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {t('camera.earnPoints')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Screen */}
      <AnimatePresence>
        {showSuccess && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, #22C55E, #16A34A)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              style={{
                width: 80, height: 80,
                borderRadius: '50%',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20
              }}
            >
              <CheckCircle size={48} color="#22C55E" />
            </motion.div>
            <h2 style={{ color: 'white', fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>{t('camera.success')}</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 20px' }}>{t('camera.greatChoice')}</p>
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              borderRadius: 16, 
              padding: '16px 32px',
              textAlign: 'center'
            }}>
              <p style={{ color: 'white', fontSize: 36, fontWeight: 700, margin: 0 }}>
                +{Math.round(result.points * (parseFloat(weight) || 0.5))}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' }}>{t('common.points')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
