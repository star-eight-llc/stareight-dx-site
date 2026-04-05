// ============================================================
// DX診断結果 PDF + GAS連携 v11 最終版
// レーダーチャート: showResults後500msでブラウザCanvasをキャプチャ
// → PDF生成時にImage.onloadで確実に埋め込む
// ============================================================
(function() {
  'use strict';
  var _resultData = null;
  var _jspdfLoaded = false;
  var _orig = window.showResults;
  var _diagStartTime = null;
  var _radarImageData = null;

  var _origStart = window.startDiagnosis;
  if (typeof _origStart === 'function') {
    window.startDiagnosis = function() { _diagStartTime = new Date(); _origStart.apply(this, arguments); };
  }

  window.showResults = function() {
    var catScores = categories.map(function(cat, ci) {
      var idxs = []; allQuestions.forEach(function(q, i) { if (q.category === ci) idxs.push(i); });
      var total = 0; idxs.forEach(function(i) { total += answers[i]; });
      var maxScore = cat.questions.length * 2;
      return { name: cat.name, icon: cat.icon, color: cat.color, service: cat.service, score: total, max: maxScore, pct: Math.round((total / maxScore) * 100) };
    });
    var totalScore = 0, totalMax = 0;
    catScores.forEach(function(c) { totalScore += c.score; totalMax += c.max; });
    var totalPct = Math.round((totalScore / totalMax) * 100);
    var level, levelName, levelMsg;
    if (totalPct >= 80) { level='A'; levelName='発展活用期'; levelMsg='DXの基盤はかなり整っています。データ活用やAI活用をさらに実務へ定着させることで、より高い成果につなげやすい状態です。'; }
    else if (totalPct >= 60) { level='B'; levelName='基礎整備期'; levelMsg='DXの土台はできつつありますが、改善余地も見られます。優先順位をつけて取り組むことで、業務効率や意思決定の質をさらに高められます。'; }
    else if (totalPct >= 40) { level='C'; levelName='改善着手期'; levelMsg='複数のテーマで課題が見られます。ただし、すべてを一度に進める必要はありません。効果が出やすいテーマから順に進めるのがおすすめです。'; }
    else { level='D'; levelName='初期段階'; levelMsg='DXはこれから整備していく段階です。まずは現状の課題を整理し、何から始めるべきかを明確にすることが重要です。'; }
    var sorted = catScores.slice().sort(function(a,b) { return a.pct - b.pct; });
    var actionTexts = {
      "業務プロセス・効率化": "→ SERVICE 05（Excel業務改善）で手作業を自動化し、SERVICE 03（AI Manager）で改善タスクを管理しましょう。",
      "Web・オンライン活用": "→ SERVICE 04（Web構築＋アクセス分析）で、低コストで集客できるWebサイトを構築しましょう。",
      "データ管理・統合": "→ SERVICE 05（Excel業務改善）でデータを統合し、SERVICE 06（データ可視化）でダッシュボード化しましょう。",
      "データ活用・分析": "→ SERVICE 07（データ分析）で「1つの問いにデータで答えを出す」スプリント型の分析を行いましょう。",
      "AI活用": "→ SERVICE 08（生成AI活用支援）で、自社ローカルAIを使った業務フロー実装を行いましょう。",
      "セキュリティ・IT基盤": "→ SERVICE 04のセキュリティ設定やSERVICE 03（AI Manager）でのアクセス権限管理を整備しましょう。",
      "DX推進体制": "→ SERVICE 02（DX改善プラン策定）で全体を整理し、SERVICE 09（DX顧問）で継続的に伴走しましょう。"
    };
    var svcMap = {
      "SERVICE 05 Excel業務改善": [1,2,3,10,11,13], "SERVICE 03 AI Manager": [0,1,4,25,26],
      "SERVICE 04 Web構築＋分析": [5,6,7,8], "SERVICE 06 データ可視化": [10,11,12,15,16],
      "SERVICE 07 データ分析": [15,16,17,18,19], "SERVICE 08 生成AI活用支援": [20,21,22,23,24],
      "SERVICE 02 DX改善プラン策定": [0,4,27,28,29], "SERVICE 09 DX顧問": [27,28,29,4,19]
    };
    var svcRank = [];
    Object.keys(svcMap).forEach(function(name) {
      var qIdxs = svcMap[name]; var issueScore = 0;
      qIdxs.forEach(function(qi) { issueScore += (2 - (answers[qi] || 0)); });
      svcRank.push({ name: name, avg: issueScore / qIdxs.length, count: qIdxs.length });
    });
    svcRank.sort(function(a,b) { return b.avg - a.avg; });
    var svcTop3 = svcRank.slice(0, 3);
    _resultData = { totalPct: totalPct, level: level, levelName: levelName, levelMsg: levelMsg,
      catScores: catScores, sorted: sorted, actionTexts: actionTexts, svcTop3: svcTop3, allAnswers: answers.slice() };
    _orig.apply(this, arguments);

    // ブラウザのレーダーチャートCanvasをキャプチャ（描画完了後500ms）
    setTimeout(function() {
      try {
        var rc = document.getElementById('radarChart');
        if (rc) { _radarImageData = rc.toDataURL('image/png'); console.log('Radar captured: ' + _radarImageData.length + ' bytes'); }
        else { console.log('radarChart not found'); }
      } catch(e) { console.log('radar capture error:', e); }
    }, 500);

    sendToGAS(_resultData);
    rewriteCtaLink();
    injectPdfButton();
  };

  // ====== GAS送信 ======
  var GAS_URL = 'https://script.google.com/macros/s/AKfycbxJi_DMG0HpJftAFnS9V1LkAqaTPq9s3pZ08nCKWYwVqC3tcPRUplGB6bxoXrJNUUvP/exec';
  function sendToGAS(data) {
    try {
      var now = new Date();
      var diagId = 'DX-' + now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '-' + String(Math.floor(Math.random()*10000)).padStart(4,'0');
      var top3Str = data.sorted.slice(0,3).map(function(c,i) { return (i+1)+'.'+c.name+'('+c.pct+'点)'; }).join(', ');
      var cs = data.catScores;
      var payload = {
        diagId: diagId, timestamp: now.toISOString(), score: data.totalPct,
        level: data.levelName || ('Level ' + data.level),
        cat1: cs[0] ? cs[0].pct + '点' : '', cat2: cs[1] ? cs[1].pct + '点' : '',
        cat3: cs[2] ? cs[2].pct + '点' : '', cat4: cs[3] ? cs[3].pct + '点' : '',
        cat5: cs[4] ? cs[4].pct + '点' : '', cat6: cs[5] ? cs[5].pct + '点' : '',
        cat7: cs[6] ? cs[6].pct + '点' : '',
        top3: top3Str, referrer: document.referrer || '(direct)',
        utm_source: (new URLSearchParams(window.location.search)).get('utm_source') || '',
        utm_medium: (new URLSearchParams(window.location.search)).get('utm_medium') || '',
        utm_campaign: (new URLSearchParams(window.location.search)).get('utm_campaign') || '',
        duration_sec: _diagStartTime ? Math.round((now - _diagStartTime) / 1000) : '',
        screen_width: window.innerWidth,
        device: window.innerWidth <= 768 ? 'スマホ' : window.innerWidth <= 1024 ? 'タブレット' : 'PC',
        svc_top1: (data.svcTop3 && data.svcTop3[0]) ? data.svcTop3[0].name : '',
        svc_top2: (data.svcTop3 && data.svcTop3[1]) ? data.svcTop3[1].name : '',
        svc_top3: (data.svcTop3 && data.svcTop3[2]) ? data.svcTop3[2].name : '',
        answers_all: (data.allAnswers || []).join(','), userAgent: navigator.userAgent
      };
      window.__diagId = diagId;
      var iframe = document.createElement('iframe'); iframe.name = '__gasFrame'; iframe.style.display = 'none'; document.body.appendChild(iframe);
      var form = document.createElement('form'); form.method = 'POST'; form.action = GAS_URL; form.target = '__gasFrame'; form.style.display = 'none';
      Object.keys(payload).forEach(function(k) { var input = document.createElement('input'); input.type = 'hidden'; input.name = k; input.value = payload[k]; form.appendChild(input); });
      document.body.appendChild(form); form.submit();
      setTimeout(function() { form.remove(); iframe.remove(); }, 10000);
    } catch (e) { console.log('GAS送信スキップ:', e); }
  }

  function rewriteCtaLink() {
    var results = document.getElementById('diag-results');
    if (!results || !_resultData) return;
    var d = _resultData, params = new URLSearchParams();
    params.set('from', 'diagnosis'); params.set('diagId', window.__diagId || '');
    params.set('score', d.totalPct); params.set('level', d.levelName || d.level);
    if (d.svcTop3) params.set('svcTop3', d.svcTop3.map(function(s) { return s.name; }).join(','));
    results.querySelectorAll('a[href*="contact.html"]').forEach(function(a) { a.href = 'contact.html?' + params.toString(); });
  }

  function injectPdfButton() {
    var results = document.getElementById('diag-results');
    if (!results || document.getElementById('pdfDownloadBtn')) return;
    var ctaBanner = results.querySelector('.cta-banner');
    var container = document.createElement('div'); container.style.cssText = 'text-align:center; margin: 32px 0;';
    container.innerHTML = '<button id="pdfDownloadBtn" style="display:inline-flex;align-items:center;gap:8px;padding:14px 32px;background:linear-gradient(135deg,#1a5276 0%,#2980b9 100%);color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(26,82,118,0.3);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>診断結果をPDFでダウンロード</button><p style="margin-top:8px;font-size:13px;color:#888;">レーダーチャート付きで保存できます</p>';
    container.querySelector('button').onclick = onClickPdf;
    if (ctaBanner) ctaBanner.parentNode.insertBefore(container, ctaBanner); else results.appendChild(container);
  }

  function loadJsPdf(cb) {
    if (_jspdfLoaded && window.jspdf) { cb(); return; }
    if (window.jspdf) { _jspdfLoaded = true; cb(); return; }
    var urls = [
      'js/jspdf.umd.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js',
      'https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js',
      'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js'
    ];
    function tryLoad(idx) {
      if (idx >= urls.length) { cb(new Error('jsPDFの読み込みに失敗しました。ページを再読み込みしてお試しください。')); return; }
      var s = document.createElement('script'); s.src = urls[idx];
      s.onload = function() { if (window.jspdf) { _jspdfLoaded = true; cb(); } else { tryLoad(idx + 1); } };
      s.onerror = function() { tryLoad(idx + 1); };
      document.head.appendChild(s);
    }
    tryLoad(0);
  }

  function onClickPdf() {
    if (!_resultData) return;
    var btn = document.getElementById('pdfDownloadBtn'), origHTML = btn.innerHTML;
    btn.disabled = true; btn.style.opacity = '0.7'; btn.innerHTML = 'PDF生成中...';
    loadJsPdf(function(err) {
      if (err) { alert(err.message); btn.innerHTML = origHTML; btn.style.opacity = '1'; btn.disabled = false; return; }
      setTimeout(function() {
        try {
          buildPdfBlobAsync(function(blob) {
            var url = URL.createObjectURL(blob), a = document.createElement('a'), d = new Date();
            a.href = url; a.download = 'DX_Diagnosis_' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + '.pdf';
            a.click(); URL.revokeObjectURL(url);
            btn.innerHTML = '✓ ダウンロード完了！'; btn.style.background = 'linear-gradient(135deg,#27ae60 0%,#2ecc71 100%)'; btn.style.opacity = '1';
            setTimeout(function() { btn.innerHTML = origHTML; btn.style.background = 'linear-gradient(135deg,#1a5276 0%,#2980b9 100%)'; btn.disabled = false; }, 2500);
          });
        } catch (e) { console.error('PDF error:', e); alert('PDF生成エラー: ' + e.message); btn.innerHTML = origHTML; btn.style.opacity = '1'; btn.disabled = false; }
      }, 50);
    });
  }

  // ====== PDF生成（非同期・レーダーチャート画像対応） ======
  function buildPdfBlobAsync(callback) {
    var data = _resultData, d = new Date();
    var ds = d.getFullYear() + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + String(d.getDate()).padStart(2,'0');
    var W = 720, DPR = 2;

    // レーダーチャート画像をImageオブジェクトに事前ロード
    var radarImg = null;
    function generate() {
      var canvas = document.createElement('canvas'); canvas.width = W * DPR;
      var ctx = canvas.getContext('2d'); ctx.scale(DPR, DPR);
      var totalH = drawContent(ctx, W, data, ds, true, null);
      canvas.height = totalH * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, totalH);
      drawContent(ctx, W, data, ds, false, radarImg);

      var pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
      var pw = 210, ph = 297, margin = 8, cW = pw - margin * 2;
      var imgH = (canvas.height / canvas.width) * cW;
      if (imgH <= ph - margin * 2) {
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, cW, imgH);
      } else {
        var srcY = 0, pn = 0;
        while (srcY < canvas.height) {
          if (pn > 0) pdf.addPage();
          var sl = Math.min(((ph - margin * 2) / cW) * canvas.width, canvas.height - srcY);
          var sc = document.createElement('canvas'); sc.width = canvas.width; sc.height = sl;
          sc.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, sl, 0, 0, sc.width, sc.height);
          pdf.addImage(sc.toDataURL('image/png'), 'PNG', margin, margin, cW, (sl / canvas.width) * cW);
          srcY += sl; pn++;
        }
      }
      var pages = pdf.internal.getNumberOfPages();
      for (var p = 1; p <= pages; p++) { pdf.setPage(p); pdf.setFontSize(7); pdf.setTextColor(160); pdf.text('StarEight LLC | https://stareight-dx.com', pw/2, ph-4, {align:'center'}); pdf.text(p+'/'+pages, pw-margin, ph-4, {align:'right'}); }
      callback(pdf.output('blob'));
    }

    if (_radarImageData) {
      radarImg = new Image();
      radarImg.onload = function() { console.log('Radar image loaded for PDF'); generate(); };
      radarImg.onerror = function() { console.log('Radar image load failed, using direct draw'); radarImg = null; generate(); };
      radarImg.src = _radarImageData;
    } else {
      generate();
    }
  }

  // ====== Canvas描画 ======
  function drawContent(ctx, W, data, dateStr, dryRun, radarImg) {
    var F = '"Noto Sans JP","Hiragino Sans","Hiragino Kaku Gothic ProN","Meiryo",sans-serif';
    var P = 50, CW = W - P * 2, y = 0, cx = W / 2, hH = 90;
    if (!dryRun) { ctx.fillStyle='#1a5276'; ctx.fillRect(0,0,W,hH); ctx.fillStyle='#fff'; ctx.font='bold 15px '+F; ctx.fillText('★ StarEight DX Consulting',P,35); ctx.font='bold 26px '+F; ctx.fillText('DX診断レポート',P,65); ctx.font='13px '+F; ctx.textAlign='right'; ctx.fillText('診断日：'+dateStr,W-P,65); ctx.textAlign='left'; }
    y = hH + 50;
    var lc = getLevelHex(data.level), cR = 62;
    if (!dryRun) { ctx.beginPath();ctx.arc(cx,y+cR,cR+4,0,Math.PI*2);ctx.fillStyle='#f5f5f5';ctx.fill(); ctx.beginPath();ctx.arc(cx,y+cR,cR,0,Math.PI*2);ctx.strokeStyle=lc;ctx.lineWidth=6;ctx.stroke(); ctx.fillStyle=lc;ctx.font='bold 56px '+F;ctx.textAlign='center';ctx.fillText(String(data.totalPct),cx,y+cR+12); ctx.fillStyle='#999';ctx.font='15px '+F;ctx.fillText('/ 100点',cx,y+cR+34); }
    y += cR*2+35;
    if (!dryRun) { ctx.fillStyle=lc;ctx.font='bold 26px '+F;ctx.textAlign='center';ctx.fillText('DXレベル：'+(data.levelName||data.level),cx,y); }
    y += 22;
    var lvLines = wrapText(ctx, data.levelMsg, CW-40, '15px '+F);
    if (!dryRun) { ctx.fillStyle='#777';ctx.font='15px '+F;ctx.textAlign='center'; lvLines.forEach(function(l){ctx.fillText(l,cx,y);y+=20;}); ctx.textAlign='left'; } else { y += lvLines.length*20; }
    y += 30;

    // ====== レーダーチャート ======
    var RADAR_H = 320;
    if (!dryRun) { ctx.fillStyle='#1a5276';ctx.font='bold 20px '+F;ctx.textAlign='left';ctx.fillText('7カテゴリ別スコア（レーダーチャート）',P,y);ctx.fillStyle='#2980b9';ctx.fillRect(P,y+6,280,3); }
    y += 30;
    if (!dryRun) {
      if (radarImg && radarImg.complete && radarImg.naturalWidth > 0) {
        // キャプチャ済み画像を埋め込む（Image.onloadで事前ロード済み）
        var rSize = 280;
        ctx.drawImage(radarImg, cx - rSize/2, y, rSize, rSize);
      } else {
        // フォールバック：直接描画
        drawRadarDirect(ctx, cx, y, data, F);
      }
    }
    y += RADAR_H;

    // カテゴリ別バー
    if (!dryRun) { ctx.fillStyle='#1a5276';ctx.font='bold 20px '+F;ctx.textAlign='left';ctx.fillText('カテゴリ別スコア',P,y);ctx.fillStyle='#2980b9';ctx.fillRect(P,y+6,160,3); }
    y += 30;
    data.catScores.forEach(function(c) {
      var bc = getBarHex(c.pct);
      if (!dryRun) { ctx.fillStyle='#333';ctx.font='15px '+F;ctx.textAlign='left';ctx.fillText(c.icon+'  '+c.name,P,y);ctx.fillStyle=bc;ctx.font='bold 16px '+F;ctx.textAlign='right';ctx.fillText(c.pct+'点',W-P,y);ctx.textAlign='left'; }
      y += 10;
      if (!dryRun) { ctx.fillStyle='#eee';roundRect(ctx,P,y,CW,10,5);ctx.fill();if(c.pct>0){ctx.fillStyle=bc;roundRect(ctx,P,y,Math.max(10,(c.pct/100)*CW),10,5);ctx.fill();} }
      y += 14;
      if (!dryRun) { ctx.fillStyle='#aaa';ctx.font='10px '+F;ctx.fillText('対応SERVICE：'+c.service,P,y); }
      y += 24;
    });
    y += 25;

    // ACTION TOP3（100点対応）
    var lowCats = data.sorted.filter(function(c) { return c.pct < 80; });
    if (lowCats.length === 0) {
      if (!dryRun) { ctx.fillStyle='#1a5276';ctx.font='bold 20px '+F;ctx.fillText('診断結果のまとめ',P,y);ctx.fillStyle='#2980b9';ctx.fillRect(P,y+6,160,3); }
      y += 32;
      var cH = 100;
      if (!dryRun) { ctx.fillStyle='#f0fdf4';roundRect(ctx,P,y,CW,cH,8);ctx.fill();ctx.strokeStyle='#bbf7d0';ctx.lineWidth=1;roundRect(ctx,P,y,CW,cH,8);ctx.stroke();ctx.fillStyle='#2D8B57';ctx.fillRect(P,y+8,4,cH-16);ctx.fillStyle='#2D8B57';ctx.font='bold 16px '+F;ctx.textAlign='center';ctx.fillText('素晴らしい結果です！全カテゴリで高い水準を達成しています。',cx,y+35);ctx.fillStyle='#555';ctx.font='14px '+F;ctx.fillText('より高い成果を目指したい場合は、ぜひ無料相談でご相談ください。',cx,y+60);ctx.textAlign='left'; }
      y += cH + 18;
    } else {
      if (!dryRun) { ctx.fillStyle='#1a5276';ctx.font='bold 20px '+F;ctx.fillText('まず取り組むべきDXアクション TOP3',P,y);ctx.fillStyle='#2980b9';ctx.fillRect(P,y+6,320,3); }
      y += 32;
      for (var i=0;i<3&&i<data.sorted.length;i++) {
        var cat=data.sorted[i], at=data.actionTexts[cat.name]||'';
        var cf='14px '+F, lines=wrapText(ctx,at,CW-60,cf), cardH=38+lines.length*20+16;
        if (!dryRun) { ctx.fillStyle='#f8fafb';roundRect(ctx,P,y,CW,cardH,8);ctx.fill();ctx.strokeStyle='#e0e8ef';ctx.lineWidth=1;roundRect(ctx,P,y,CW,cardH,8);ctx.stroke();ctx.fillStyle=cat.color||'#2980b9';ctx.fillRect(P,y+8,4,cardH-16); }
        var ix=P+20, iy=y+24;
        if (!dryRun) { ctx.fillStyle=cat.color||'#2980b9';ctx.font='bold 14px '+F;ctx.fillText('ACTION '+(i+1)+'：'+cat.icon+' '+cat.name+'（現在 '+cat.pct+'点）',ix,iy); }
        iy+=22;
        if (!dryRun) { ctx.fillStyle='#555';ctx.font=cf;lines.forEach(function(l){ctx.fillText(l,ix,iy);iy+=20;}); }
        y += cardH+18;
      }
    }
    y += 35;

    // SERVICE TOP3
    if (data.svcTop3 && data.svcTop3.length > 0) {
      if (!dryRun) { ctx.fillStyle='#1a5276';ctx.font='bold 20px '+F;ctx.fillText('御社におすすめのスターエイト SERVICE TOP3',P,y);ctx.fillStyle='#2980b9';ctx.fillRect(P,y+6,380,3); }
      y += 32;
      var sd={"SERVICE 02 DX改善プラン策定":"課題が複数にまたがっており、まず全体の整理が必要です。","SERVICE 03 AI Manager":"AI搭載の業務管理SaaSで改善タスクの実行を確実にします。","SERVICE 04 Web構築＋分析":"低コストで高品質なサイト構築＋GA4分析を提供します。","SERVICE 05 Excel業務改善":"VBA/Python/GASで自動化し大幅な時間短縮を実現します。","SERVICE 06 データ可視化":"KPIダッシュボードを構築します。","SERVICE 07 データ分析":"2〜4週間のスプリント型で答えを出します。","SERVICE 08 生成AI活用支援":"自社ローカルAIで業務フローにAIを組み込みます。","SERVICE 09 DX顧問":"月次の固定納品物＋チケット制で継続的に伴走します。"};
      for (var si=0;si<3&&si<data.svcTop3.length;si++) {
        var sv=data.svcTop3[si]; var dl=sv.avg>=1.2?'課題度：高':sv.avg>=0.6?'課題度：中':'課題度：低'; var dc=sv.avg>=1.2?'#CC4444':sv.avg>=0.6?'#E67E22':'#2D8B57';
        var svD=sd[sv.name]||''; var sf='14px '+F, sl=wrapText(ctx,svD,CW-60,sf); var scH=38+sl.length*20+16;
        if (!dryRun) { ctx.fillStyle='#f8fafb';roundRect(ctx,P,y,CW,scH,8);ctx.fill();ctx.strokeStyle='#e0e8ef';ctx.lineWidth=1;roundRect(ctx,P,y,CW,scH,8);ctx.stroke();ctx.fillStyle=dc;ctx.fillRect(P,y+8,4,scH-16); }
        var sx=P+20,sy=y+24;
        if (!dryRun) { ctx.fillStyle='#1a5276';ctx.font='bold 15px '+F;ctx.fillText((si+1)+'. '+sv.name,sx,sy);ctx.fillStyle=dc;ctx.font='bold 12px '+F;ctx.textAlign='right';ctx.fillText(dl,W-P-16,sy);ctx.textAlign='left'; }
        sy+=22;
        if (!dryRun) { ctx.fillStyle='#555';ctx.font=sf;sl.forEach(function(l){ctx.fillText(l,sx,sy);sy+=20;}); }
        y+=scH+18;
      }
      y+=10;
      if (!dryRun) { ctx.fillStyle='#aaa';ctx.font='11px '+F;ctx.fillText('※上記は診断結果をもとにした一般的なご提案です。',P,y); }
      y+=30;
    }
    // CTA
    if (!dryRun) { ctx.fillStyle='#1a5276';roundRect(ctx,P,y,CW,90,10);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 17px '+F;ctx.textAlign='center';ctx.fillText('次のステップ：SERVICE 02「DX改善プラン策定」',cx,y+30);ctx.fillStyle='#b0d4f1';ctx.font='13px '+F;ctx.fillText('診断結果をもとに、90日間のDX改善ロードマップを作成します。',cx,y+52);ctx.fillStyle='#fff';ctx.font='12px '+F;ctx.fillText('https://stareight-dx.com/contact.html',cx,y+74);ctx.textAlign='left'; }
    y+=120;
    if (!dryRun) { ctx.fillStyle='#bbb';ctx.font='11px '+F;ctx.textAlign='center';ctx.fillText('© 2026 StarEight LLC.',cx,y);ctx.textAlign='left'; }
    y+=30; return y;
  }

  function drawRadarDirect(ctx, cx, startY, data, F) {
    var rCx=cx, rCy=startY+130, R=110, n=data.catScores.length;
    var step=(2*Math.PI)/n, sA=-Math.PI/2;
    for(var g=1;g<=5;g++){var r=R*(g/5);ctx.beginPath();for(var i=0;i<=n;i++){var a=sA+i*step;var x=rCx+r*Math.cos(a);var yy=rCy+r*Math.sin(a);if(i===0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);}ctx.closePath();ctx.strokeStyle='#e2e8f0';ctx.lineWidth=1;ctx.stroke();}
    for(var i=0;i<n;i++){var a=sA+i*step;ctx.beginPath();ctx.moveTo(rCx,rCy);ctx.lineTo(rCx+R*Math.cos(a),rCy+R*Math.sin(a));ctx.strokeStyle='#e2e8f0';ctx.lineWidth=1;ctx.stroke();}
    ctx.beginPath();for(var i=0;i<n;i++){var a=sA+i*step;var r=R*(data.catScores[i].pct/100);if(i===0)ctx.moveTo(rCx+r*Math.cos(a),rCy+r*Math.sin(a));else ctx.lineTo(rCx+r*Math.cos(a),rCy+r*Math.sin(a));}ctx.closePath();ctx.fillStyle='rgba(45,139,87,0.2)';ctx.fill();ctx.strokeStyle='#2D8B57';ctx.lineWidth=2;ctx.stroke();
    for(var i=0;i<n;i++){var a=sA+i*step;var r=R*(data.catScores[i].pct/100);ctx.beginPath();ctx.arc(rCx+r*Math.cos(a),rCy+r*Math.sin(a),4,0,Math.PI*2);ctx.fillStyle='#2D8B57';ctx.fill();}
    ctx.textAlign='center';var sn=["業務プロセス","Web活用","データ管理","データ活用","AI活用","セキュリティ","DX推進体制"];
    for(var i=0;i<n;i++){var a=sA+i*step;var lR=R+32;var lx=rCx+lR*Math.cos(a);var ly=rCy+lR*Math.sin(a);ctx.fillStyle='#333';ctx.font='bold 12px '+F;ctx.fillText(sn[i],lx,ly+4);ctx.fillStyle=getBarHex(data.catScores[i].pct);ctx.font='bold 11px '+F;ctx.fillText(data.catScores[i].pct+'点',lx,ly+18);}
    ctx.textAlign='left';
  }

  function wrapText(ctx,t,mW,f){ctx.font=f;var ls=[],c='';for(var i=0;i<t.length;i++){var x=c+t[i];if(ctx.measureText(x).width>mW&&c.length>0){ls.push(c);c=t[i];}else{c=x;}}if(c)ls.push(c);return ls;}
  function roundRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}
  function getLevelHex(l){return l==='A'?'#2D8B57':l==='B'?'#2E75B6':l==='C'?'#E67E22':'#CC4444';}
  function getBarHex(p){return p>=60?'#2D8B57':p>=40?'#E67E22':'#CC4444';}
})();
