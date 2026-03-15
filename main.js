@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&family=Outfit:wght@300;400;500;600;700&display=swap');

:root {
  --navy: #1B2A4A;
  --blue: #2E75B6;
  --blue-light: #E8F1FA;
  --blue-50: #F0F6FC;
  --green: #2D8B57;
  --green-light: #E8F5EE;
  --pink: #F4A0B8;
  --white: #FFFFFF;
  --gray-50: #FAFAFA;
  --gray-100: #F5F5F5;
  --gray-200: #EEEEEE;
  --gray-300: #DDDDDD;
  --gray-500: #888888;
  --gray-700: #555555;
  --gray-900: #222222;
  --body: #333333;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.1);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.12);
  --radius: 12px;
  --radius-sm: 8px;
  --transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  font-family: 'Noto Sans JP', sans-serif;
  color: var(--body);
  line-height: 1.8;
  background: var(--white);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5 {
  font-family: 'Outfit', 'Noto Sans JP', sans-serif;
  color: var(--navy);
  line-height: 1.4;
  font-weight: 700;
}

a { color: var(--blue); text-decoration: none; transition: color var(--transition); }
a:hover { color: var(--navy); }

img { max-width: 100%; height: auto; }

.container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

/* ===== HEADER / NAV ===== */
.site-header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--gray-200);
  transition: box-shadow var(--transition);
}
.site-header.scrolled { box-shadow: var(--shadow-sm); }

.nav-inner {
  max-width: 1100px; margin: 0 auto; padding: 0 24px;
  display: flex; align-items: center; justify-content: space-between;
  height: 64px;
}

.nav-logo {
  display: flex; align-items: center; gap: 10px;
  font-family: 'Outfit', sans-serif; font-weight: 700;
  font-size: 18px; color: var(--navy); text-decoration: none;
}
.nav-logo .star { color: var(--green); font-size: 22px; }
.nav-logo .dx-badge {
  background: var(--blue);
  color: var(--white);
  font-size: 11px; font-weight: 600;
  padding: 2px 8px; border-radius: 4px;
  letter-spacing: 0.5px;
}

.nav-links { display: flex; gap: 28px; list-style: none; }
.nav-links a {
  font-size: 14px; font-weight: 500; color: var(--gray-700);
  text-decoration: none; position: relative; padding: 4px 0;
}
.nav-links a::after {
  content: ''; position: absolute; bottom: -2px; left: 0;
  width: 0; height: 2px; background: var(--blue);
  transition: width var(--transition);
}
.nav-links a:hover::after, .nav-links a.active::after { width: 100%; }
.nav-links a:hover { color: var(--blue); }

.nav-cta {
  background: var(--blue); color: var(--white) !important;
  padding: 8px 20px; border-radius: 6px; font-size: 13px;
  font-weight: 600; transition: all var(--transition);
}
.nav-cta:hover { background: var(--navy); transform: translateY(-1px); }

.hamburger {
  display: none; background: none; border: none; cursor: pointer;
  width: 28px; height: 20px; position: relative;
}
.hamburger span {
  display: block; width: 100%; height: 2px; background: var(--navy);
  position: absolute; left: 0; transition: all var(--transition);
}
.hamburger span:nth-child(1) { top: 0; }
.hamburger span:nth-child(2) { top: 9px; }
.hamburger span:nth-child(3) { top: 18px; }

/* ===== HERO ===== */
.hero {
  padding: 140px 0 80px;
  background: linear-gradient(135deg, var(--navy) 0%, #1a3a6a 50%, #2a5090 100%);
  color: var(--white);
  position: relative; overflow: hidden;
}
.hero::before {
  content: ''; position: absolute; top: -50%; right: -30%;
  width: 80%; height: 200%; border-radius: 50%;
  background: radial-gradient(circle, rgba(46,117,182,0.15) 0%, transparent 70%);
}
.hero-inner { display: flex; align-items: center; gap: 60px; position: relative; z-index: 1; }
.hero-text { flex: 1; }
.hero-text .tag {
  display: inline-block;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  padding: 6px 16px; border-radius: 20px;
  font-size: 13px; font-weight: 500; margin-bottom: 20px;
  letter-spacing: 0.5px;
}
.hero h1 { font-size: 38px; font-weight: 900; line-height: 1.3; margin-bottom: 20px; color: var(--white); }
.hero h1 .accent { color: #7DB8E8; }
.hero p { font-size: 16px; line-height: 1.8; opacity: 0.85; margin-bottom: 32px; }
.hero-visual { flex: 0 0 360px; text-align: center; }
.hero-visual .icon-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
}
.hero-visual .icon-card {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: var(--radius-sm);
  padding: 20px 12px; text-align: center;
  transition: all var(--transition);
}
.hero-visual .icon-card:hover {
  background: rgba(255,255,255,0.14);
  transform: translateY(-4px);
}
.hero-visual .icon-card .emoji { font-size: 28px; margin-bottom: 6px; }
.hero-visual .icon-card .label { font-size: 11px; opacity: 0.7; }

/* ===== BUTTONS ===== */
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 32px; border-radius: var(--radius-sm);
  font-size: 15px; font-weight: 600; text-decoration: none;
  transition: all var(--transition); border: none; cursor: pointer;
}
.btn-primary { background: var(--blue); color: var(--white); }
.btn-primary:hover { background: #1e5fa0; color: var(--white); transform: translateY(-2px); box-shadow: var(--shadow-md); }
.btn-white { background: var(--white); color: var(--navy); }
.btn-white:hover { background: var(--gray-100); color: var(--navy); transform: translateY(-2px); }
.btn-outline { background: transparent; color: var(--blue); border: 2px solid var(--blue); }
.btn-outline:hover { background: var(--blue); color: var(--white); }
.btn-ghost { background: rgba(255,255,255,0.12); color: var(--white); border: 1px solid rgba(255,255,255,0.25); }
.btn-ghost:hover { background: rgba(255,255,255,0.2); color: var(--white); }
.btn-group { display: flex; gap: 16px; flex-wrap: wrap; }

/* ===== SECTIONS ===== */
.section { padding: 80px 0; }
.section-alt { background: var(--gray-50); }
.section-blue { background: var(--blue-50); }
.section-header { text-align: center; margin-bottom: 48px; }
.section-header h2 { font-size: 30px; margin-bottom: 12px; }
.section-header .subtitle { font-size: 15px; color: var(--gray-500); }
.section-header .line {
  width: 48px; height: 3px; background: var(--blue);
  margin: 16px auto 0; border-radius: 2px;
}

/* ===== CARDS ===== */
.card {
  background: var(--white);
  border-radius: var(--radius);
  border: 1px solid var(--gray-200);
  padding: 32px;
  transition: all var(--transition);
}
.card:hover { box-shadow: var(--shadow-md); transform: translateY(-4px); border-color: var(--blue); }
.card-icon {
  width: 52px; height: 52px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; margin-bottom: 16px;
}
.card-icon.blue { background: var(--blue-light); }
.card-icon.green { background: var(--green-light); }
.card h3 { font-size: 18px; margin-bottom: 10px; }
.card p { font-size: 14px; color: var(--gray-700); line-height: 1.7; }

.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }

/* ===== SERVICE CARDS ===== */
.service-card {
  background: var(--white);
  border-radius: var(--radius);
  border: 1px solid var(--gray-200);
  padding: 28px;
  position: relative; overflow: hidden;
  transition: all var(--transition);
}
.service-card::before {
  content: ''; position: absolute; top: 0; left: 0;
  width: 4px; height: 100%; background: var(--blue);
  transform: scaleY(0); transition: transform var(--transition);
  transform-origin: top;
}
.service-card:hover::before { transform: scaleY(1); }
.service-card:hover { box-shadow: var(--shadow-md); border-color: var(--blue); }
.service-card .num {
  font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 700;
  color: var(--blue); margin-bottom: 8px; letter-spacing: 1px;
}
.service-card h3 { font-size: 17px; margin-bottom: 10px; }
.service-card p { font-size: 13px; color: var(--gray-700); line-height: 1.7; }
.service-card .price {
  margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--gray-200);
  font-size: 13px; color: var(--blue); font-weight: 600;
}

/* ===== STATS ===== */
.stats { display: flex; justify-content: center; gap: 60px; padding: 40px 0; }
.stat { text-align: center; }
.stat .number {
  font-family: 'Outfit', sans-serif; font-size: 42px;
  font-weight: 800; color: var(--blue); line-height: 1;
}
.stat .label { font-size: 13px; color: var(--gray-500); margin-top: 6px; }

/* ===== CTA BANNER ===== */
.cta-banner {
  background: linear-gradient(135deg, var(--navy) 0%, var(--blue) 100%);
  color: var(--white); padding: 60px; border-radius: var(--radius);
  text-align: center;
}
.cta-banner h2 { font-size: 28px; color: var(--white); margin-bottom: 12px; }
.cta-banner p { opacity: 0.85; margin-bottom: 28px; font-size: 15px; }

/* ===== FLOW / STEPS ===== */
.flow { display: flex; gap: 20px; counter-reset: step; }
.flow-step {
  flex: 1; text-align: center; position: relative;
  padding: 28px 16px;
}
.flow-step::before {
  counter-increment: step;
  content: counter(step);
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--blue); color: var(--white);
  font-family: 'Outfit', sans-serif; font-weight: 700;
  font-size: 16px; margin: 0 auto 14px;
}
.flow-step h4 { font-size: 15px; margin-bottom: 8px; }
.flow-step p { font-size: 13px; color: var(--gray-500); }
.flow-step + .flow-step::after {
  content: ''; position: absolute; top: 48px; left: -12px;
  width: 24px; height: 2px; background: var(--gray-300);
}

/* ===== PROFILE ===== */
.profile-card {
  display: flex; gap: 40px; align-items: flex-start;
  background: var(--white); border-radius: var(--radius);
  padding: 40px; border: 1px solid var(--gray-200);
}
.profile-photo {
  width: 160px; height: 160px; border-radius: 50%;
  background: var(--blue-light);
  display: flex; align-items: center; justify-content: center;
  font-size: 48px; flex-shrink: 0;
}
.profile-info h3 { font-size: 22px; margin-bottom: 4px; }
.profile-info .title { font-size: 14px; color: var(--gray-500); margin-bottom: 16px; }
.profile-info .bio { font-size: 14px; line-height: 1.8; }

.tag-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.tag {
  background: var(--blue-light); color: var(--blue);
  padding: 4px 12px; border-radius: 4px;
  font-size: 12px; font-weight: 500;
}

/* ===== CASE STUDY ===== */
.case-card {
  background: var(--white); border-radius: var(--radius);
  border: 1px solid var(--gray-200); overflow: hidden;
  transition: all var(--transition);
}
.case-card:hover { box-shadow: var(--shadow-md); }
.case-card .case-header {
  padding: 24px 28px; background: var(--blue-50);
  border-bottom: 1px solid var(--gray-200);
}
.case-card .case-header .industry {
  font-size: 12px; color: var(--blue); font-weight: 600;
  margin-bottom: 6px; letter-spacing: 0.5px;
}
.case-card .case-header h3 { font-size: 17px; }
.case-card .case-body { padding: 24px 28px; }
.case-card .case-body p { font-size: 14px; line-height: 1.7; }
.case-card .result {
  margin-top: 16px; padding: 12px 16px;
  background: var(--green-light); border-radius: var(--radius-sm);
  font-size: 14px; color: var(--green); font-weight: 600;
}

/* ===== FORM ===== */
.form-group { margin-bottom: 20px; }
.form-group label {
  display: block; font-size: 14px; font-weight: 600;
  color: var(--navy); margin-bottom: 6px;
}
.form-group input, .form-group textarea, .form-group select {
  width: 100%; padding: 12px 16px; border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm); font-size: 14px;
  font-family: 'Noto Sans JP', sans-serif;
  transition: border-color var(--transition);
}
.form-group input:focus, .form-group textarea:focus, .form-group select:focus {
  outline: none; border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(46,117,182,0.1);
}
.form-group textarea { min-height: 140px; resize: vertical; }

/* ===== FOOTER ===== */
.site-footer {
  background: var(--navy); color: rgba(255,255,255,0.7);
  padding: 48px 0 24px;
}
.footer-inner { display: flex; justify-content: space-between; gap: 40px; margin-bottom: 32px; }
.footer-brand .footer-logo {
  font-family: 'Outfit', sans-serif; font-size: 20px;
  font-weight: 700; color: var(--white); margin-bottom: 8px;
}
.footer-brand .footer-logo .star { color: var(--green); }
.footer-brand p { font-size: 13px; line-height: 1.7; }
.footer-links h4 { color: var(--white); font-size: 14px; margin-bottom: 12px; }
.footer-links ul { list-style: none; }
.footer-links li { margin-bottom: 8px; }
.footer-links a { color: rgba(255,255,255,0.6); font-size: 13px; }
.footer-links a:hover { color: var(--white); }
.footer-bottom {
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 20px; text-align: center;
  font-size: 12px;
}

/* ===== DIAGNOSIS ===== */
.diag-progress {
  width: 100%; height: 6px; background: var(--gray-200);
  border-radius: 3px; margin-bottom: 32px; overflow: hidden;
}
.diag-progress .bar {
  height: 100%; background: var(--blue); border-radius: 3px;
  transition: width 0.5s ease;
}
.diag-question { margin-bottom: 24px; }
.diag-question h3 { font-size: 16px; margin-bottom: 12px; }
.diag-options { display: flex; flex-direction: column; gap: 10px; }
.diag-option {
  padding: 14px 20px; border: 2px solid var(--gray-200);
  border-radius: var(--radius-sm); cursor: pointer;
  font-size: 14px; transition: all var(--transition);
}
.diag-option:hover { border-color: var(--blue); background: var(--blue-50); }
.diag-option.selected { border-color: var(--blue); background: var(--blue-light); font-weight: 600; }

.diag-result {
  text-align: center; padding: 40px;
  background: var(--white); border-radius: var(--radius);
  border: 1px solid var(--gray-200);
}
.score-circle {
  width: 140px; height: 140px; border-radius: 50%;
  border: 6px solid var(--blue);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  margin: 0 auto 24px;
}
.score-circle .score {
  font-family: 'Outfit', sans-serif;
  font-size: 42px; font-weight: 800; color: var(--blue);
  line-height: 1;
}
.score-circle .max { font-size: 14px; color: var(--gray-500); }

.radar-chart { max-width: 300px; margin: 0 auto 32px; }

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .hero-inner { flex-direction: column; }
  .hero-visual { display: none; }
  .hero h1 { font-size: 28px; }
  .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
  .flow { flex-direction: column; }
  .flow-step + .flow-step::after { display: none; }
  .stats { flex-wrap: wrap; gap: 30px; }
  .profile-card { flex-direction: column; }
  .footer-inner { flex-direction: column; }
  .nav-links { display: none; }
  .hamburger { display: block; }
  .nav-links.open {
    display: flex; flex-direction: column;
    position: absolute; top: 64px; left: 0; right: 0;
    background: var(--white); padding: 20px 24px;
    border-bottom: 1px solid var(--gray-200);
    box-shadow: var(--shadow-md);
  }
  .section { padding: 60px 0; }
  .section-header h2 { font-size: 24px; }
  .cta-banner { padding: 40px 24px; }
}
