import { Link } from 'react-router-dom';
import { MotionConfig, motion } from 'framer-motion';

const SAMPLES = [
  { label: 'PNT', image: '/catalogue/pnt.svg', position: 'left-0 top-[20%] w-[50%] h-[64%]', rotate: -7 },
  { label: 'Kurti', image: '/catalogue/kurti-photo.png', position: 'left-[24%] top-0 w-[52%] h-[70%]', rotate: 3 },
  { label: 'Kurti Set', image: '/catalogue/kurti-set-photo.png', position: 'right-0 bottom-0 w-[50%] h-[66%]', rotate: 8 },
];

export default function HeroSection() {
  return (
    <section className="weave text-white overflow-hidden">
      <div className="container-page grid lg:grid-cols-2 gap-10 items-center py-14 md:py-20">
        <div>
          <h1 className="!text-white text-4xl md:text-6xl max-w-xl">Wholesale wear, made for your business.</h1>
          <p className="mt-5 text-lg text-white/80 max-w-lg">
            Narang Textile manufactures PNT, Kurtis, KP (Kurti Pant) and complete 3-piece Kurti Sets. From cutting and stitching to finishing and dispatch, we help wholesale buyers build dependable collections.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products" className="btn-accent no-underline">View wholesale range</Link>
            <Link to="/quote" className="btn text-white border-white/60 hover:bg-white hover:text-primary no-underline">Request a wholesale quote</Link>
          </div>
        </div>

        <MotionConfig reducedMotion="user">
          <div className="relative h-[340px] md:h-[460px] w-full max-w-[560px] mx-auto lg:ml-auto" aria-label="Featured wholesale products">
            {SAMPLES.map(({ label, image, position, rotate }, i) => (
              <motion.div
                key={label}
                className={`absolute ${position}`}
                initial={{ opacity: 0, y: 40, rotate: 0 }}
                animate={{ opacity: 1, y: 0, rotate }}
                transition={{ delay: 0.15 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="relative h-full w-full overflow-hidden rounded-fabric shadow-card">
                  <img src={image} alt={label} className="h-full w-full object-cover" />
                  <div className={`absolute bottom-3 left-3 right-3 bg-white/95 px-3 py-2 text-left rounded-fabric ${i < 2 ? 'hidden md:block' : ''}`}>
                    <p className="font-display text-sm text-primary leading-tight">{label}</p>
                    <p className="text-xs text-ink/70">Shop the range</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </MotionConfig>
      </div>
    </section>
  );
}
