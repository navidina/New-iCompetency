import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Car, Palette, Play, RefreshCcw, Sparkles, Trophy, XCircle } from 'lucide-react';
import GameShell from './GameShell';
import { toPersianNum } from '../utils';
import { sfx } from '../services/audioService';

interface Props {
  onExit: () => void;
  onComplete: (score: number) => void;
}

type RunnerState = 'intro' | 'playing' | 'paused' | 'finished';

type ColorSwatch = {
  key: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
  label: string;
  ink: string;
};

type GateInstance = {
  id: number;
  word: ColorSwatch;
  ink: ColorSwatch;
  mesh: THREE.Group;
  opened: boolean;
  opening: boolean;
  resolved: boolean;
  choiceOrder?: ColorSwatch[];
};

const COLORS: ColorSwatch[] = [
  { key: 'red', label: 'قرمز', ink: '#ef4444' },
  { key: 'blue', label: 'آبی', ink: '#3b82f6' },
  { key: 'green', label: 'سبز', ink: '#22c55e' },
  { key: 'yellow', label: 'زرد', ink: '#facc15' },
  { key: 'purple', label: 'بنفش', ink: '#a855f7' },
];

const laneWidth = 4.8;
const baseSpeed = 14;
const maxSpeed = 28;

const createLabelTexture = (word: string, color: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 56px "Vazirmatn", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(word, canvas.width / 2, canvas.height / 2);
  return new THREE.CanvasTexture(canvas);
};

const makeGate = (word: ColorSwatch, ink: ColorSwatch) => {
  const group = new THREE.Group();
  const pillarGeo = new THREE.BoxGeometry(0.8, 5, 0.8);
  const pillarMat = new THREE.MeshStandardMaterial({ color: '#1f2937', metalness: 0.2, roughness: 0.6 });
  const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
  leftPillar.position.set(-laneWidth / 2, 2.5, 0);
  const rightPillar = leftPillar.clone();
  rightPillar.position.x = laneWidth / 2;

  const barGeo = new THREE.BoxGeometry(laneWidth + 1, 0.5, 0.6);
  const barMat = new THREE.MeshStandardMaterial({ color: ink.ink });
  const bar = new THREE.Mesh(barGeo, barMat);
  bar.position.set(0, 5.2, 0);

  const signGeo = new THREE.PlaneGeometry(laneWidth - 1, 1.6);
  const signMat = new THREE.MeshBasicMaterial({ map: createLabelTexture(word.label.toUpperCase(), ink.ink), transparent: true });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 6.6, 0);
  sign.rotation.y = Math.PI;

  const plateGeo = new THREE.BoxGeometry(laneWidth + 1.2, 0.4, 1.4);
  const plate = new THREE.Mesh(plateGeo, pillarMat);
  plate.position.set(0, 4.6, 0);

  group.add(leftPillar, rightPillar, bar, sign, plate);
  return group;
};

const makeCar = () => {
  const car = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(2.4, 1.2, 4);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: '#7c3aed',
    metalness: 0.55,
    roughness: 0.38,
    emissive: '#6d28d9',
    emissiveIntensity: 0.18,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.9;

  const cabinGeo = new THREE.BoxGeometry(1.8, 0.9, 2.2);
  const cabinMat = new THREE.MeshStandardMaterial({
    color: '#a855f7',
    metalness: 0.62,
    roughness: 0.32,
    emissive: '#a78bfa',
    emissiveIntensity: 0.24,
  });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, 1.5, -0.3);

  const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.5, 24);
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#0f172a' });
  const makeWheel = (x: number, z: number) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.45, z);
    return wheel;
  };

  car.add(body, cabin);
  car.add(makeWheel(-1, -1.3), makeWheel(1, -1.3), makeWheel(-1, 1.3), makeWheel(1, 1.3));

  car.userData.bodyMat = bodyMat;
  car.userData.cabinMat = cabinMat;
  return car;
};

const makeRoad = () => {
  const road = new THREE.Group();
  const baseGeo = new THREE.PlaneGeometry(22, 360, 1, 18);
  const baseMat = new THREE.MeshStandardMaterial({ color: '#0b1224', side: THREE.DoubleSide, roughness: 0.85 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.rotation.x = -Math.PI / 2;
  base.position.z = -120;

  const glowGeo = new THREE.PlaneGeometry(26, 360);
  const glowMat = new THREE.MeshBasicMaterial({ color: '#5b21b6', transparent: true, opacity: 0.12, side: THREE.DoubleSide });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.z = -120;
  glow.position.y = -0.01;

  const stripeGeo = new THREE.BoxGeometry(0.32, 0.02, 3);
  const stripeMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', emissive: '#94a3b8', emissiveIntensity: 0.3 });
  const stripes = new THREE.Group();
  stripes.name = 'road-stripes';
  for (let i = 0; i < 40; i += 1) {
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 0.02, -i * 8);
    stripe.castShadow = false;
    stripe.receiveShadow = true;
    stripes.add(stripe);
  }

  const sideRailGeo = new THREE.BoxGeometry(0.2, 0.16, 360);
  const sideRailMat = new THREE.MeshStandardMaterial({ color: '#1f2937', emissive: '#a855f7', emissiveIntensity: 0.25 });
  const leftRail = new THREE.Mesh(sideRailGeo, sideRailMat);
  const rightRail = leftRail.clone();
  leftRail.position.set(-5.4, 0.1, -120);
  rightRail.position.set(5.4, 0.1, -120);
  road.add(leftRail, rightRail);

  road.add(stripes, glow, base);
  return road;
};

const makeHeadlights = () => {
  const coneGeo = new THREE.ConeGeometry(3.4, 8, 24, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({ color: '#f8fafc', transparent: true, opacity: 0.18 });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.rotation.x = -Math.PI / 2.4;
  cone.position.set(0, 0.3, 3.6);
  return cone;
};

const ColorFocusGame: React.FC<Props> = ({ onExit, onComplete }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const carRef = useRef<THREE.Group>();
  const roadRef = useRef<THREE.Group>();
  const gateQueueRef = useRef<GateInstance[]>([]);
  const clockRef = useRef(new THREE.Clock());
  const animationRef = useRef<number>();
  const speedRef = useRef(baseSpeed);
  const lastSpawnRef = useRef(-40);

  const [gameState, setGameState] = useState<RunnerState>('intro');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [activeGate, setActiveGate] = useState<GateInstance | null>(null);
  const [choices, setChoices] = useState<ColorSwatch[]>([]);
  const [distance, setDistance] = useState(0);
  const [cleared, setCleared] = useState(0);
  const [message, setMessage] = useState('آماده‌ای؟ با رنگ جوهر، مانع را باز کن!');

  const currentSpeed = useMemo(() => Math.round(speedRef.current * 6), [gameState, score]);

  const pickColor = (exclude: string[] = []) => {
    const pool = COLORS.filter((c) => !exclude.includes(c.key));
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const syncActiveGate = () => {
    const front = gateQueueRef.current.find((g) => !g.resolved);
    if (!front) {
      setActiveGate(null);
      setChoices([]);
      return;
    }
    if (!front.choiceOrder || front.choiceOrder.length !== 2) {
      const distractor = pickColor([front.ink.key]);
      const inkLeft = Math.random() > 0.5;
      front.choiceOrder = inkLeft ? [front.ink, distractor] : [distractor, front.ink];
    }
    setActiveGate(front);
    setChoices(front.choiceOrder);
    setMessage('رنگ جوهر نوشته را انتخاب کن تا مانع بالا برود.');
  };

  const spawnGate = () => {
    const word = pickColor();
    let ink = pickColor([word.key]);
    if (ink.key === word.key) {
      ink = pickColor([word.key]);
    }
    const gateMesh = makeGate(word, ink);
    gateMesh.position.set(0, 0, lastSpawnRef.current - 18 - Math.random() * 6);
    gateMesh.scale.setScalar(1.05);
    gateMesh.castShadow = true;

    sceneRef.current?.add(gateMesh);

    gateQueueRef.current.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      word,
      ink,
      mesh: gateMesh,
      opened: false,
      opening: false,
      resolved: false,
      choiceOrder: undefined,
    });
    lastSpawnRef.current = gateMesh.position.z;
    syncActiveGate();
  };

  const disposeThree = () => {
    gateQueueRef.current.forEach((g) => {
      g.mesh.traverse((child) => {
        if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
        if ((child as THREE.Mesh).material) {
          const material = (child as THREE.Mesh).material as THREE.Material | THREE.Material[];
          if (Array.isArray(material)) material.forEach((m) => m.dispose());
          else material.dispose();
        }
      });
      sceneRef.current?.remove(g.mesh);
    });
    gateQueueRef.current.length = 0;
  };

  const resetGame = () => {
    sfx.playClick();
    clockRef.current.stop();
    speedRef.current = baseSpeed;
    lastSpawnRef.current = -40;
    setScore(0);
    setLives(3);
    setDistance(0);
    setCleared(0);
    setMessage('با زدن رنگ جوهر، گیت را باز کن. سه جان داری، حواست را جمع کن!');
    gateQueueRef.current.forEach((g) => sceneRef.current?.remove(g.mesh));
    gateQueueRef.current.length = 0;
    spawnGate();
    spawnGate();
    spawnGate();
    clockRef.current.start();
  };

  const buildScene = () => {
    const width = mountRef.current?.clientWidth || window.innerWidth;
    const height = mountRef.current?.clientHeight || window.innerHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050915');
    scene.fog = new THREE.Fog('#050915', 18, 110);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200);
    camera.position.set(8, 12, 22);
    camera.lookAt(0, 2, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;

    const ambient = new THREE.AmbientLight('#cbd5e1', 0.92);
    const dirLight = new THREE.DirectionalLight('#ffffff', 0.9);
    dirLight.position.set(8, 16, 14);
    dirLight.castShadow = true;

    const rimLight = new THREE.SpotLight('#7c3aed', 1.2, 80, Math.PI / 5, 0.4, 1.4);
    rimLight.position.set(-6, 12, 6);
    rimLight.target.position.set(0, 0, -40);
    scene.add(rimLight.target);

    const headLight = new THREE.SpotLight('#f8fafc', 1.6, 32, Math.PI / 6, 0.5, 1.8);
    headLight.position.set(0, 4, 10);
    headLight.target.position.set(0, 0, -10);
    scene.add(headLight.target);

    const carFill = new THREE.PointLight('#c4b5fd', 1.4, 26, 2.4);
    carFill.position.set(0, 3.5, 6);

    const dashGlow = new THREE.PointLight('#a855f7', 0.8, 16, 2.2);
    dashGlow.position.set(0, 2.2, 4);

    scene.add(ambient, dirLight, rimLight, headLight, carFill, dashGlow);

    const road = makeRoad();
    scene.add(road);
    roadRef.current = road;

    const car = makeCar();
    car.position.set(0, 0, 6);
    car.castShadow = true;
    const lightCone = makeHeadlights();
    car.add(lightCone);
    scene.add(car);
    carRef.current = car;

    const particles = new THREE.Group();
    for (let i = 0; i < 32; i += 1) {
      const sparkGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const sparkMat = new THREE.MeshBasicMaterial({ color: '#c084fc', transparent: true, opacity: 0.7 });
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.set((Math.random() - 0.5) * 10, 0.5 + Math.random() * 4, -Math.random() * 80);
      particles.add(spark);
    }
    scene.add(particles);

    if (mountRef.current) {
      mountRef.current.innerHTML = '';
      mountRef.current.appendChild(renderer.domElement);
    }

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
  };

  const handleResize = () => {
    const width = mountRef.current?.clientWidth || window.innerWidth;
    const height = mountRef.current?.clientHeight || window.innerHeight;
    rendererRef.current?.setSize(width, height);
    if (cameraRef.current) {
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const crash = (reason: string) => {
    sfx.playError();
    setMessage(reason);
    setLives(0);
    setGameState('finished');
  };

  const loseLife = (reason: string, gateToClear?: GateInstance) => {
    sfx.playError();
    setLives((prev) => {
      const next = Math.max(prev - 1, 0);
      if (next <= 0) {
        setMessage(`${reason} جانت تمام شد.`);
        setGameState('finished');
      } else {
        setMessage(`${reason} یک جان از دست رفت. (${toPersianNum(next)}/۳ باقی مانده)`);
        const target = gateToClear ?? gateQueueRef.current.find((g) => !g.resolved);
        if (target) {
          target.resolved = true;
          sceneRef.current?.remove(target.mesh);
          gateQueueRef.current = gateQueueRef.current.filter((g) => g.id !== target.id);
          syncActiveGate();
        }
      }
      return next;
    });
  };

  const repaintCar = (color: string) => {
    const bodyMat = carRef.current?.userData.bodyMat as THREE.MeshStandardMaterial | undefined;
    const cabinMat = carRef.current?.userData.cabinMat as THREE.MeshStandardMaterial | undefined;
    if (bodyMat) {
      bodyMat.color = new THREE.Color(color);
      bodyMat.emissive = new THREE.Color(color).multiplyScalar(0.4);
      bodyMat.needsUpdate = true;
    }
    if (cabinMat) {
      cabinMat.color = new THREE.Color(color);
      cabinMat.emissive = new THREE.Color(color).multiplyScalar(0.35);
      cabinMat.needsUpdate = true;
    }
  };

  const liftGate = (gate: GateInstance) => {
    gate.opening = true;
    gate.resolved = true;
    sfx.playSuccess();
    setScore((prev) => prev + 15 + Math.round(speedRef.current));
    setCleared((prev) => prev + 1);
    speedRef.current = Math.min(maxSpeed, speedRef.current + 0.8);
    repaintCar(gate.ink.ink);
    syncActiveGate();
  };

  const handleChoice = (key: string) => {
    if (gameState !== 'playing') return;
    const target = gateQueueRef.current.find((g) => !g.resolved);
    if (!target) return;
    if (key === target.ink.key) {
      liftGate(target);
    } else {
      loseLife('انتخاب نادرست! خودرو به مانع خورد.', target);
    }
  };

  const animate = () => {
    if (gameState !== 'playing') return;
    const delta = clockRef.current.getDelta();

    setDistance((prev) => prev + Math.round(speedRef.current * delta));

    gateQueueRef.current.forEach((gate) => {
      gate.mesh.position.z += speedRef.current * delta;
      gate.mesh.children.forEach((child) => {
        child.position.z = 0;
      });
      if (gate.opening && gate.mesh.position.y < 6) {
        gate.mesh.position.y = THREE.MathUtils.lerp(gate.mesh.position.y, 7, 0.06);
      }
      if (!gate.resolved && gate.mesh.position.z > 5) {
        loseLife('دیر واکنش دادی! خودرو به مانع خورد.', gate);
      }
      if (gate.mesh.position.z > 16) {
        sceneRef.current?.remove(gate.mesh);
        gateQueueRef.current = gateQueueRef.current.filter((g) => g.id !== gate.id);
        syncActiveGate();
      }
    });

    if (gateQueueRef.current.length < 4 || (gateQueueRef.current.at(-1)?.mesh.position.z ?? 0) > lastSpawnRef.current + 18) {
      spawnGate();
    }

    if (roadRef.current) {
      const stripeGroup = roadRef.current.getObjectByName('road-stripes');
      stripeGroup?.children.forEach((child) => {
        child.position.z += speedRef.current * delta;
        if (child.position.z > 14) child.position.z = -300;
      });
    }

    if (cameraRef.current && carRef.current) {
      const desired = new THREE.Vector3(8, 11.5, 20);
      cameraRef.current.position.lerp(desired, 0.05);
      cameraRef.current.lookAt(new THREE.Vector3(0, 1.6, -8));
    }

    sceneRef.current?.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.SphereGeometry) {
        obj.position.z += speedRef.current * delta * 0.6;
        obj.position.y += Math.sin(clockRef.current.elapsedTime * 2 + obj.position.x) * 0.001;
        if (obj.position.z > 8) obj.position.z = -90 - Math.random() * 40;
      }
    });

    rendererRef.current?.render(sceneRef.current as THREE.Scene, cameraRef.current as THREE.Camera);
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    buildScene();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current || 0);
      rendererRef.current?.dispose();
      disposeThree();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      if (gateQueueRef.current.length === 0) {
        resetGame();
      }
      clockRef.current.start();
      animationRef.current = requestAnimationFrame(animate);
    } else {
      clockRef.current.stop();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = undefined;
      if (gameState === 'intro') {
        resetGame();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      clockRef.current.stop();
      try {
        sfx.suspend?.();
      } catch (e) {
        // no-op
      }
    };
  }, []);

  const finishCard = (
    <div className="flex flex-col items-center gap-5 p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center shadow-2xl">
        <Trophy size={36} />
      </div>
      <h3 className="text-2xl font-black text-slate-900">پایان ران! تمرکزت چطور بود؟</h3>
      <p className="text-slate-500 text-sm max-w-lg">
        هرچه سریع‌تر رنگ جوهر را پیدا کنی، سرعت بالا می‌رود. با هر اشتباه یک جان از دست می‌دهی و با از دست دادن همه جان‌ها خودرو می‌ایستد. دوباره امتحان کن و کمبو بساز.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm text-right">
          <div className="text-[11px] font-bold text-slate-500 mb-1">امتیاز</div>
          <div className="text-4xl font-black text-purple-600">{toPersianNum(score)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm text-right">
          <div className="text-[11px] font-bold text-slate-500 mb-1">گیت‌های رد شده</div>
          <div className="text-3xl font-black text-indigo-600">{toPersianNum(cleared)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm text-right">
          <div className="text-[11px] font-bold text-slate-500 mb-1">مسافت ذهنی</div>
          <div className="text-3xl font-black text-emerald-600">{toPersianNum(distance)}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        <button
          onClick={() => onComplete(score)}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-2xl font-black text-lg shadow-lg"
        >
          ثبت و خروج
        </button>
            <button
              onClick={() => {
                resetGame();
                setGameState('playing');
                setLives(3);
              }}
              className="w-full bg-white text-slate-700 border border-slate-200 py-3 rounded-2xl font-bold text-lg hover:bg-slate-50"
            >
              تلاش دوباره
            </button>
      </div>
    </div>
  );

  const overlays = (
    <>
      {gameState === 'intro' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-lg border border-slate-200 shadow-2xl rounded-3xl p-6 max-w-xl text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center">
              <Palette />
            </div>
            <h2 className="text-2xl font-black text-slate-900">رانر سنجش تمرکز رنگی</h2>
            <p className="text-slate-500 text-sm">
              خودرو خودکار می‌تازد. کلمه روی مانع را ببین و رنگ جوهر را انتخاب کن. سه جان داری؛ با هر اشتباه یک جان از دست می‌دهی.
            </p>
            <button
              onClick={() => setGameState('playing')}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-2xl font-black text-lg shadow-md"
            >
              شروع ران
            </button>
          </div>
        </div>
      )}
      {gameState === 'finished' && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl border border-slate-100 max-w-3xl w-full">
            {finishCard}
          </div>
        </div>
      )}
    </>
  );

  return (
    <GameShell
      title="مسیر تمرکز سه‌بعدی"
      description="یک رانر ایزومتریک بر پایه اثر استروپ: رنگ جوهر نوشته را بزن تا گیت باز شود."
      instructions={[
        'رنگ جوهر نوشته روی مانع را انتخاب کن، نه معنای کلمه را.',
        'اگر دیر واکنش دهی یا اشتباه بزنی، یک جان از دست می‌دهی؛ سه جان داری.',
        'هر گیت درست، سرعت را بالا می‌برد و امتیاز بیشتری می‌دهد.',
      ]}
      icon={<Palette />}
      stats={{ score, timeLeft: undefined, level: Math.max(1, Math.round(speedRef.current / 5)), combo: cleared, lives, maxLives: 3 }}
      onExit={onExit}
      onRestart={() => {
        resetGame();
        setGameState('playing');
      }}
      gameState={gameState}
      setGameState={setGameState}
      colorTheme="purple"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full w-full max-w-[1500px] mx-auto lg:min-h-[calc(100vh-150px)]">
        <div className="lg:col-span-3 relative rounded-[28px] overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-slate-800 shadow-2xl min-h-[60vh]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(168,85,247,0.08),transparent_45%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 via-transparent to-transparent" />
          <div className="absolute top-4 left-4 flex items-center gap-3 text-xs text-white/80">
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur">
              <Car size={14} /> سرعت ذهنی: <span className="font-black text-white">{toPersianNum(currentSpeed)}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur">
              <Sparkles size={14} className="text-amber-300" /> گیت‌های رد شده: {toPersianNum(cleared)}
            </div>
          </div>
          <div ref={mountRef} className="relative w-full h-[60vh] lg:h-[72vh] xl:h-[78vh]" />
          <div className="absolute left-0 right-0 bottom-0 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-white/90 gap-2">
            <div className="flex items-center gap-2">
              <Play size={16} className="text-emerald-300" /> {message}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur">
              <Trophy size={14} className="text-amber-300" /> امتیاز: {toPersianNum(score)}
            </div>
          </div>
          {overlays}
        </div>

        <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl p-4 space-y-4 relative overflow-hidden">
          <div className="absolute inset-x-6 top-2 h-32 bg-gradient-to-br from-purple-100 via-white to-indigo-50 rounded-full blur-3xl opacity-60" />
          <div className="relative bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-purple-600 font-black text-sm">
              <Palette size={18} /> چالش رنگ جوهر
            </div>
            <p className="text-slate-600 text-xs mt-2 leading-relaxed">
              روی مانع کلمه‌ای می‌بینی که با رنگ دیگری نوشته شده است. دکمه‌ای را بزن که با رنگ جوهر متن همخوانی دارد.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
              <span className="px-2 py-1 rounded-full bg-white border border-slate-200">بازی ایزومتریک</span>
              <span className="px-2 py-1 rounded-full bg-white border border-slate-200">اثر استروپ</span>
              <span className="px-2 py-1 rounded-full bg-white border border-slate-200">پاسخ سریع</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 relative">
            {choices.map((c) => (
              <button
                key={c.key}
                onClick={() => handleChoice(c.key)}
                className="relative overflow-hidden rounded-2xl p-4 text-white font-black shadow-lg hover:-translate-y-1 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white"
                style={{ backgroundImage: `linear-gradient(135deg, ${c.ink}, ${c.ink}dd)` }}
              >
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_45%)]" />
                <div className="relative flex items-center justify-between">
                  <span className="text-lg drop-shadow-sm">{c.label}</span>
                  <span className="w-9 h-9 rounded-xl bg-white/25 border border-white/40 shadow-inner" />
                </div>
              </button>
            ))}
          </div>

          <div className="relative rounded-2xl border border-slate-100 p-4 bg-slate-50/90 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 font-bold">مسافت ذهنی</span>
              <span className="text-xl font-black text-slate-900">{toPersianNum(distance)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  resetGame();
                  setGameState('playing');
                }}
                className="px-3 py-2 bg-purple-600 text-white rounded-xl flex items-center gap-2 text-sm font-bold shadow-md"
              >
                <RefreshCcw size={16} /> از نو
              </button>
              <button
                onClick={() => crash('به درخواست بازیکن متوقف شد.')}
                className="px-3 py-2 bg-slate-200 text-slate-700 rounded-xl flex items-center gap-2 text-sm font-bold"
              >
                <XCircle size={16} /> توقف
              </button>
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
};

export default ColorFocusGame;
