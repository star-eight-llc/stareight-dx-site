// ============================================================
// DX診断結果 PDF + 無料相談連携 v10 — SERVICE 00-09直結版
// PDF = ダウンロード専用（レーダーチャート付き）
// GAS = スプレッドシート自動送信
// ============================================================
(function() {
  'use strict';

  var _resultData = null;
  var _jspdfLoaded = false;
  var _orig = window.showResults;
  var _diagStartTime = null;

  var _origStart = window.startDiagnosis;
  if (typeof _origStart === 'function') {
    window.startDiagnosis = function() {
      _diagStartTime = new Date();
      _origStart.apply(this, arguments);
    };
  }

  window.showResults = function() {
    var catScores = categories.map(function(cat, ci) {
      var idxs = [];
      allQuestions.forEach(function(q, i) { if (q.category === ci) idxs.push(i); });
      var total = 0;
      idxs.forEach(function(i) { total += answers[i]; });
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

    // SERVICE TOP3
    var svcMap = {
      "SERVICE 02 DX改善プラン策定": [0,4,27,28,29],
      "SERVICE 03 AI Manager": [0,1,4,25,26],
      "SERVICE 04 Web構築＋分析": [5,6,7,8],
      "SERVICE 05 Excel業務改善": [1,2,3,10,11,13],
      "SERVICE 06 データ可視化": [10,11,12,15,16],
      "SERVICE 07 データ分析": [15,16,17,18,19],
      "SERVICE 08 生成AI活用支援": [20,21,22,23,24],
      "SERVICE 09 DX顧問": [27,28,29,4,19]
    };
    var svcRank = [];
    Object.keys(svcMap).forEach(function(name) {
      var qIdxs = svcMap[name];
      var issueScore = 0;
      qIdxs.forEach(function(qi) { issueScore += (2 - (answers[qi] || 0)); });
      svcRank.push({ name: name, avg: issueScore / qIdxs.length, count: qIdxs.length });
    });
    svcRank.sort(function(a,b) { return b.avg - a.avg; });
    var svcTop3 = svcRank.slice(0, 3);

    _resultData = {
      totalPct: totalPct, level: level, levelName: levelName, levelMsg: levelMsg,
      catScores: catScores, sorted: sorted, actionTexts: actionTexts,
      svcTop3: svcTop3, allAnswers: answers.slice()
    };
    _orig.apply(this, arguments);
    sendToGAS(_resultData);
    rewriteCtaLink();
    injectPdfButton();
  };

  // ====== GAS送信 ======
  var GAS_URL = 'https://script.google.com/macros/s/AKfycbxJi_DMG0HpJftAFnS9V1LkAqaTPq9s3pZ08nCKWYwVqC3tcPRUplGB6bxoXrJNUUvP/exec';

  function sendToGAS(data) {
    try {
      var now = new Date();
      var diagId = 'DX-' + now.getFullYear() +
        String(now.getMonth()+1).padStart(2,'0') +
        String(now.getDate()).padStart(2,'0') + '-' +
        String(Math.floor(Math.random()*10000)).padStart(4,'0');

      var catFields = {};
      data.catScores.forEach(function(c) { catFields[c.name] = c.pct + '点'; });
      var top3Str = data.sorted.slice(0,3).map(function(c,i) { return (i+1)+'.'+c.name+'('+c.pct+'点)'; }).join(', ');

      var payload = {
        diagId: diagId,
        timestamp: now.toISOString(),
        score: data.totalPct,
        level: data.levelName || ('Level ' + data.level),
        cat1: catFields['業務プロセス・効率化'] || '',
        cat2: catFields['Web・オンライン活用'] || '',
        cat3: catFields['データ管理・統合'] || '',
        cat4: catFields['データ活用・分析'] || '',
        cat5: catFields['AI活用'] || '',
        cat6: catFields['セキュリティ・IT基盤'] || '',
        cat7: catFields['DX推進体制'] || '',
        top3: top3Str,
        referrer: document.referrer || '(direct)',
        utm_source: (new URLSearchParams(window.location.search)).get('utm_source') || '',
        utm_medium: (new URLSearchParams(window.location.search)).get('utm_medium') || '',
        utm_campaign: (new URLSearchParams(window.location.search)).get('utm_campaign') || '',
        duration_sec: _diagStartTime ? Math.round((now - _diagStartTime) / 1000) : '',
        screen_width: window.innerWidth,
        device: window.innerWidth <= 768 ? 'スマホ' : window.innerWidth <= 1024 ? 'タブレット' : 'PC',
        svc_top1: (data.svcTop3 && data.svcTop3[0]) ? data.svcTop3[0].name : '',
        svc_top2: (data.svcTop3 && data.svcTop3[1]) ? data.svcTop3[1].name : '',
        svc_top3: (data.svcTop3 && data.svcTop3[2]) ? data.svcTop3[2].name : '',
        answers_all: (data.allAnswers || []).join(','),
        userAgent: navigator.userAgent
      };

      window.__diagId = diagId;
      window.__diagScore = data.totalPct;
      window.__diagLevel = data.level;

      var iframe = document.createElement('iframe');
      iframe.name = '__gasFrame'; iframe.style.display = 'none';
      document.body.appendChild(iframe);
      var form = document.createElement('form');
      form.method = 'POST'; form.action = GAS_URL; form.target = '__gasFrame'; form.style.display = 'none';
      Object.keys(payload).forEach(function(k) {
        var input = document.createElement('input');
        input.type = 'hidden'; input.name = k; input.value = payload[k];
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
      setTimeout(function() { form.remove(); iframe.remove(); }, 10000);
      console.log('DX診断データ送信完了: ' + diagId);
    } catch (e) { console.log('GAS送信スキップ:', e); }
  }

  // ====== CTAリンク ======
  function rewriteCtaLink() {
    var results = document.getElementById('diag-results');
    if (!results || !_resultData) return;
    var d = _resultData;
    var params = new URLSearchParams();
    params.set('from', 'diagnosis');
    params.set('diagId', window.__diagId || '');
    params.set('score', d.totalPct);
    params.set('level', d.levelName || d.level);
    params.set('cats', d.catScores.map(function(c) { return c.name + ':' + c.pct; }).join(','));
    params.set('top3', d.sorted.slice(0,3).map(function(c) { return c.name; }).join(','));
    if (d.svcTop3) params.set('svcTop3', d.svcTop3.map(function(s) { return s.name; }).join(','));
    var contactUrl = 'contact.html?' + params.toString();
    results.querySelectorAll('a[href*="contact.html"]').forEach(function(a) { a.href = contactUrl; });
  }

  // ====== PDFボタン ======
  function injectPdfButton() {
    var results = document.getElementById('diag-results');
    if (!results || document.getElementById('pdfDownloadBtn')) return;
    var ctaBanner = results.querySelector('.cta-banner');
    var container = document.createElement('div');
    container.style.cssText = 'text-align:center; margin: 32px 0;';
    container.innerHTML =
      '<button id="pdfDownloadBtn" style="display:inline-flex;align-items:center;gap:8px;padding:14px 32px;background:linear-gradient(135deg,#1a5276 0%,#2980b9 100%);color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(26,82,118,0.3);transition:all 0.3s ease;">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>診断結果をPDFでダウンロード</button>' +
      '<p style="margin-top:8px;font-size:13px;color:#888;">レーダーチャート付きで保存できます</p>';
    var btn = container.querySelector('button');
    btn.onmouseenter = function() { this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(26,82,118,0.4)'; };
    btn.onmouseleave = function() { this.style.transform=''; this.style.boxShadow='0 4px 14px rgba(26,82,118,0.3)'; };
    btn.onclick = onClickPdf;
    if (ctaBanner) ctaBanner.parentNode.insertBefore(container, ctaBanner);
    else results.appendChild(container);
  }

  function loadJsPdf(callback) {
    if (_jspdfLoaded && window.jspdf) { callback(); return; }
    var urls = ['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js','https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js'];
    function tryLoad(idx) {
      if (idx >= urls.length) { callback(new Error('jsPDFの読み込みに失敗しました。')); return; }
      var s = document.createElement('script'); s.src = urls[idx];
      s.onload = function() { if (window.jspdf) { _jspdfLoaded = true; callback(); } else { tryLoad(idx+1); } };
      s.onerror = function() { tryLoad(idx+1); };
      document.head.appendChild(s);
    }
    if (window.jspdf) { _jspdfLoaded = true; callback(); return; }
    tryLoad(0);
  }

  function onClickPdf() {
    if (!_resultData) return;
    var btn = document.getElementById('pdfDownloadBtn');
    var origHTML = btn.innerHTML;
    btn.disabled = true; btn.style.opacity = '0.7'; btn.innerHTML = 'PDF生成中...';
    loadJsPdf(function(err) {
      if (err) { alert(err.message); btn.innerHTML = origHTML; btn.style.opacity = '1'; btn.disabled = false; return; }
      setTimeout(function() {
        try {
          var blob = buildPdfBlob();
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          var d = new Date();
          a.href = url;
          a.download = 'DX_Diagnosis_' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + '.pdf';
          a.click(); URL.revokeObjectURL(url);
          btn.innerHTML = '✓ ダウンロード完了！';
          btn.style.background = 'linear-gradient(135deg,#27ae60 0%,#2ecc71 100%)'; btn.style.opacity = '1';
          setTimeout(function() { btn.innerHTML = origHTML; btn.style.background = 'linear-gradient(135deg,#1a5276 0%,#2980b9 100%)'; btn.disabled = false; }, 2500);
          if (typeof ga4PdfDownload === 'function') ga4PdfDownload(_resultData.totalPct, _resultData.levelName || _resultData.level);
        } catch (e) {
          console.error('PDF error:', e); alert('PDF生成エラー: ' + e.message);
          btn.innerHTML = origHTML; btn.style.background = 'linear-gradient(135deg,#1a5276 0%,#2980b9 100%)'; btn.style.opacity = '1'; btn.disabled = false;
        }
      }, 50);
    });
  }

  // ====== PDF Blob生成（レーダーチャート付き） ======
  function buildPdfBlob() {
    var data = _resultData;
    var d = new Date();
    var ds = d.getFullYear() + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + String(d.getDate()).padStart(2,'0');
    var W = 720, DPR = 2;
    var canvas = document.createElement('canvas'); canvas.width = W * DPR;
    var ctx = canvas.getContext('2d'); ctx.scale(DPR, DPR);
    var totalH = drawContent(ctx, W, data, ds, true);
    canvas.height = totalH * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, totalH);
    drawContent(ctx, W, data, ds, false);
    var pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
    var pw = 210, ph = 297, margin = 8, contentW = pw - margin * 2;
    var imgData = canvas.toDataURL('image/png');
    var imgH = (canvas.height / canvas.width) * contentW;
    if (imgH <= ph - margin * 2) {
      pdf.addImage(imgData, 'PNG', margin, margin, contentW, imgH);
    } else {
      var srcY = 0, pageNum = 0;
      while (srcY < canvas.height) {
        if (pageNum > 0) pdf.addPage();
        var slicePx = Math.min(((ph - margin * 2) / contentW) * canvas.width, canvas.height - srcY);
        var sc = document.createElement('canvas'); sc.width = canvas.width; sc.height = slicePx;
        sc.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, slicePx, 0, 0, sc.width, sc.height);
        pdf.addImage(sc.toDataURL('image/png'), 'PNG', margin, margin, contentW, (slicePx / canvas.width) * contentW);
        srcY += slicePx; pageNum++;
      }
    }
    var pages = pdf.internal.getNumberOfPages();
    for (var p = 1; p <= pages; p++) {
      pdf.setPage(p); pdf.setFontSize(7); pdf.setTextColor(160,160,160);
      pdf.text('StarEight LLC | https://stareight-dx.com', pw/2, ph-4, {align:'center'});
      pdf.text(p+'/'+pages, pw-margin, ph-4, {align:'right'});
    }
    return pdf.output('blob');
  }

  // ====== Canvas描画（レーダーチャート付き） ======
  function drawContent(ctx, W, data, dateStr, dryRun) {
    var FONT = '"Noto Sans JP","Hiragino Sans","Hiragino Kaku Gothic ProN","Meiryo",sans-serif';
    var PAD = 50, CW = W - PAD * 2, y = 0, headerH = 90;
    if (!dryRun) { ctx.fillStyle='#1a5276'; ctx.fillRect(0,0,W,headerH); ctx.fillStyle='#fff'; ctx.font='bold 15px '+FONT; ctx.fillText('★ StarEight DX Consulting',PAD,35); ctx.font='bold 26px '+FONT; ctx.fillText('DX診断レポート',PAD,65); ctx.font='13px '+FONT; ctx.textAlign='right'; ctx.fillText('診断日：'+dateStr,W-PAD,65); ctx.textAlign='left'; }
    y=headerH+15;
    var cx=W/2, lc=getLevelHex(data.level), circleR=62;
    if(!dryRun){ ctx.beginPath();ctx.arc(cx,y+circleR,circleR+4,0,Math.PI*2);ctx.fillStyle='#f5f5f5';ctx.fill(); ctx.beginPath();ctx.arc(cx,y+circleR,circleR,0,Math.PI*2);ctx.strokeStyle=lc;ctx.lineWidth=6;ctx.stroke(); ctx.fillStyle=lc;ctx.font='bold 56px '+FONT;ctx.textAlign='center';ctx.fillText(String(data.totalPct),cx,y+circleR+12); ctx.fillStyle='#999';ctx.font='15px '+FONT;ctx.fillText('/ 100点',cx,y+circleR+34); }
    y+=circleR*2+35;
    if(!dryRun){ctx.fillStyle=lc;ctx.font='bold 26px '+FONT;ctx.textAlign='center';ctx.fillText('DXレベル：'+(data.levelName||data.level),cx,y);}
    y+=22;
    if(!dryRun){ctx.fillStyle='#777';ctx.font='15px '+FONT;ctx.textAlign='center';var lvLines=wrapText(ctx,data.levelMsg,CW-40,'15px '+FONT);lvLines.forEach(function(l){ctx.fillText(l,cx,y);y+=20;});ctx.textAlign='left';}else{var lvLines=wrapText(ctx,data.levelMsg,CW-40,'15px '+FONT);y+=lvLines.length*20;}
    y+=20;

    // ====== レーダーチャート（ブラウザCanvasをキャプチャ） ======
    if(!dryRun){ctx.fillStyle='#1a5276';ctx.font='bold 20px '+FONT;ctx.textAlign='left';ctx.fillText('7カテゴリ別スコア（レーダーチャート）',PAD,y);ctx.fillStyle='#2980b9';ctx.fillRect(PAD,y+6,280,3);}
    y+=30;
    var radarH = 300;
    if(!dryRun){
      // ブラウザ上のradarChartキャンバスをキャプチャして埋め込む
      var browserRadar = document.getElementById('radarChart');
      if(browserRadar){
        try{
          var radarW = 300;
          var radarX = cx - radarW/2;
          ctx.drawImage(browserRadar, radarX, y, radarW, radarW);
          
        }catch(e){
          console.log('radar capture error, falling back to manual draw:', e);
          // フォールバック：手動描画
          var radarCx=cx, radarCy=y+130, radarR=110, n=data.catScores.length;
          var angleStep=(2*Math.PI)/n, startAngle=-Math.PI/2;
          for(var g=1;g<=5;g++){var r=radarR*(g/5);ctx.beginPath();for(var i=0;i<=n;i++){var a=startAngle+i*angleStep;var px=radarCx+r*Math.cos(a);var py=radarCy+r*Math.sin(a);if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.strokeStyle='#e2e8f0';ctx.lineWidth=1;ctx.stroke();}
          for(var i=0;i<n;i++){var a=startAngle+i*angleStep;ctx.beginPath();ctx.moveTo(radarCx,radarCy);ctx.lineTo(radarCx+radarR*Math.cos(a),radarCy+radarR*Math.sin(a));ctx.strokeStyle='#e2e8f0';ctx.lineWidth=1;ctx.stroke();}
          ctx.beginPath();for(var i=0;i<n;i++){var a=startAngle+i*angleStep;var r=radarR*(data.catScores[i].pct/100);ctx.lineTo(radarCx+r*Math.cos(a),radarCy+r*Math.sin(a));}ctx.closePath();ctx.fillStyle='rgba(45,139,87,0.2)';ctx.fill();ctx.strokeStyle='#2D8B57';ctx.lineWidth=2;ctx.stroke();
          for(var i=0;i<n;i++){var a=startAngle+i*angleStep;var r=radarR*(data.catScores[i].pct/100);ctx.beginPath();ctx.arc(radarCx+r*Math.cos(a),radarCy+r*Math.sin(a),4,0,Math.PI*2);ctx.fillStyle='#2D8B57';ctx.fill();}
          ctx.textAlign='center';var sn=["業務プロセス","Web活用","データ管理","データ活用","AI活用","セキュリティ","DX推進体制"];
          for(var i=0;i<n;i++){var a=startAngle+i*angleStep;var lR=radarR+32;ctx.fillStyle='#333';ctx.font='bold 12px '+FONT;ctx.fillText(sn[i],radarCx+lR*Math.cos(a),radarCy+lR*Math.sin(a)+4);ctx.fillStyle=getBarHex(data.catScores[i].pct);ctx.font='bold 11px '+FONT;ctx.fillText(data.catScores[i].pct+'点',radarCx+lR*Math.cos(a),radarCy+lR*Math.sin(a)+18);}
          ctx.textAlign='left';
          
        }
      }
    }
    y+=radarH;

    // カテゴリ別バー
    if(!dryRun){ctx.fillStyle='#1a5276';ctx.font='bold 20px '+FONT;ctx.fillText('カテゴリ別スコア',PAD,y);ctx.fillStyle='#2980b9';ctx.fillRect(PAD,y+6,160,3);}
    y+=30;
    data.catScores.forEach(function(c){ var bc=getBarHex(c.pct); if(!dryRun){ctx.fillStyle='#333';ctx.font='13px '+FONT;ctx.textAlign='left';ctx.fillText(c.icon+'  '+c.name,PAD,y);ctx.fillStyle=bc;ctx.font='bold 13px '+FONT;ctx.textAlign='right';ctx.fillText(c.pct+'点',W-PAD,y);ctx.textAlign='left';} y+=13; if(!dryRun){ctx.fillStyle='#eee';roundRect(ctx,PAD,y,CW,7,3);ctx.fill();if(c.pct>0){ctx.fillStyle=bc;roundRect(ctx,PAD,y,Math.max(7,(c.pct/100)*CW),7,3);ctx.fill();}} y+=14;if(!dryRun){ctx.fillStyle='#aaa';ctx.font='9px '+FONT;ctx.fillText('対応SERVICE：'+c.service,PAD,y);}y+=15; });
    y+=15;

    // ACTION TOP3
    var lowCats = data.sorted.filter(function(c) { return c.pct < 80; });
    if(lowCats.length === 0) {
      if(!dryRun){ctx.fillStyle='#1a5276';ctx.font='bold 20px '+FONT;ctx.fillText('診断結果のまとめ',PAD,y);ctx.fillStyle='#2980b9';ctx.fillRect(PAD,y+6,160,3);}
      y+=32;
      var congratsH=100;
      if(!dryRun){ctx.fillStyle='#f0fdf4';roundRect(ctx,PAD,y,CW,congratsH,8);ctx.fill();ctx.strokeStyle='#bbf7d0';ctx.lineWidth=1;roundRect(ctx,PAD,y,CW,congratsH,8);ctx.stroke();ctx.fillStyle='#2D8B57';ctx.fillRect(PAD,y+8,4,congratsH-16);ctx.fillStyle='#2D8B57';ctx.font='bold 16px '+FONT;ctx.textAlign='center';ctx.fillText('素晴らしい結果です！全カテゴリで高い水準を達成しています。',cx,y+35);ctx.fillStyle='#555';ctx.font='14px '+FONT;ctx.fillText('より高い成果を目指したい場合は、ぜひ無料相談でご相談ください。',cx,y+60);ctx.textAlign='left';}
      y+=congratsH+18;
    } else {
      if(!dryRun){ctx.fillStyle='#1a5276';ctx.font='bold 20px '+FONT;ctx.fillText('まず取り組むべきDXアクション TOP3',PAD,y);ctx.fillStyle='#2980b9';ctx.fillRect(PAD,y+6,320,3);}
      y+=32;
      for(var i=0;i<3&&i<data.sorted.length;i++){
        var cat=data.sorted[i],actionText=data.actionTexts[cat.name]||'';
        var cardFont='14px '+FONT,lines=wrapText(ctx,actionText,CW-60,cardFont),cardH=38+lines.length*20+16;
        if(!dryRun){ctx.fillStyle='#f8fafb';roundRect(ctx,PAD,y,CW,cardH,8);ctx.fill();ctx.strokeStyle='#e0e8ef';ctx.lineWidth=1;roundRect(ctx,PAD,y,CW,cardH,8);ctx.stroke();ctx.fillStyle=cat.color||'#2980b9';ctx.fillRect(PAD,y+8,4,cardH-16);}
        var ix=PAD+20,iy=y+24;
        if(!dryRun){ctx.fillStyle=cat.color||'#2980b9';ctx.font='bold 14px '+FONT;ctx.fillText('ACTION '+(i+1)+'：'+cat.icon+' '+cat.name+'（現在 '+cat.pct+'点）',ix,iy);}
        iy+=22;
        if(!dryRun){ctx.fillStyle='#555';ctx.font=cardFont;lines.forEach(function(l){ctx.fillText(l,ix,iy);iy+=20;});}
        y+=cardH+18;
      }
    }
    y+=35;

    // SERVICE TOP3
    if(data.svcTop3 && data.svcTop3.length > 0){
      if(!dryRun){ctx.fillStyle='#1a5276';ctx.font='bold 20px '+FONT;ctx.fillText('御社におすすめのスターエイト SERVICE TOP3',PAD,y);ctx.fillStyle='#2980b9';ctx.fillRect(PAD,y+6,380,3);}
      y+=32;
      var svcDescs={
        "SERVICE 02 DX改善プラン策定":"課題が複数にまたがっており、まず全体の整理が必要です。90日ロードマップで優先順位と実行計画を策定します。",
        "SERVICE 03 AI Manager":"タスク管理・進捗管理が必要です。AI搭載の業務管理SaaSで改善タスクの実行を確実にします。",
        "SERVICE 04 Web構築＋分析":"Webサイトの活用度に改善余地があります。低コストで高品質なサイト構築＋GA4分析を提供します。",
        "SERVICE 05 Excel業務改善":"Excel集計・転記に手作業が多く残っています。VBA/Python/GASで自動化し大幅な時間短縮を実現します。",
        "SERVICE 06 データ可視化":"経営数値をタイムリーに把握する仕組みが不足しています。KPIダッシュボードを構築します。",
        "SERVICE 07 データ分析":"データはあるが分析・活用が進んでいません。2〜4週間のスプリント型で答えを出します。",
        "SERVICE 08 生成AI活用支援":"AI活用がまだ初期段階です。自社ローカルAI（データ外部送信ゼロ）で業務フローにAIを組み込みます。",
        "SERVICE 09 DX顧問":"DX推進の体制が不足しています。月次の固定納品物＋チケット制で継続的にDXを伴走します。"
      };
      for(var si=0;si<3&&si<data.svcTop3.length;si++){
        var sv=data.svcTop3[si];
        var degLabel=sv.avg>=1.2?'課題度：高':sv.avg>=0.6?'課題度：中':'課題度：低';
        var degColor=sv.avg>=1.2?'#CC4444':sv.avg>=0.6?'#E67E22':'#2D8B57';
        var svDesc=svcDescs[sv.name]||'';
        var svFont='14px '+FONT,svLines=wrapText(ctx,svDesc,CW-60,svFont);
        var svCardH=38+svLines.length*20+16;
        if(!dryRun){ctx.fillStyle='#f8fafb';roundRect(ctx,PAD,y,CW,svCardH,8);ctx.fill();ctx.strokeStyle='#e0e8ef';ctx.lineWidth=1;roundRect(ctx,PAD,y,CW,svCardH,8);ctx.stroke();ctx.fillStyle=degColor;ctx.fillRect(PAD,y+8,4,svCardH-16);}
        var sx=PAD+20,sy=y+24;
        if(!dryRun){ctx.fillStyle='#1a5276';ctx.font='bold 15px '+FONT;ctx.fillText((si+1)+'. '+sv.name,sx,sy);ctx.fillStyle=degColor;ctx.font='bold 12px '+FONT;ctx.textAlign='right';ctx.fillText(degLabel,W-PAD-16,sy);ctx.textAlign='left';}
        sy+=22;
        if(!dryRun){ctx.fillStyle='#555';ctx.font=svFont;svLines.forEach(function(l){ctx.fillText(l,sx,sy);sy+=20;});}
        y+=svCardH+18;
      }
      y+=10;
      if(!dryRun){ctx.fillStyle='#aaa';ctx.font='11px '+FONT;ctx.fillText('※上記は診断結果をもとにした一般的なご提案です。実際の進め方は無料相談で詳しくお伺いします。',PAD,y);}
      y+=30;
    }

    // CTA
    if(!dryRun){ctx.fillStyle='#1a5276';roundRect(ctx,PAD,y,CW,90,10);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 17px '+FONT;ctx.textAlign='center';ctx.fillText('次のステップ：SERVICE 02「DX改善プラン策定」',cx,y+30);ctx.fillStyle='#b0d4f1';ctx.font='13px '+FONT;ctx.fillText('診断結果をもとに、90日間のDX改善ロードマップを作成します。',cx,y+52);ctx.fillStyle='#fff';ctx.font='12px '+FONT;ctx.fillText('https://stareight-dx.com/contact.html',cx,y+74);ctx.textAlign='left';}
    y+=120;
    if(!dryRun){ctx.fillStyle='#bbb';ctx.font='11px '+FONT;ctx.textAlign='center';ctx.fillText('© 2026 StarEight LLC. All rights reserved.',cx,y);ctx.textAlign='left';}
    y+=30; return y;
  }

  function wrapText(ctx,text,maxW,font){ctx.font=font;var lines=[],cur='';for(var i=0;i<text.length;i++){var t=cur+text[i];if(ctx.measureText(t).width>maxW&&cur.length>0){lines.push(cur);cur=text[i];}else{cur=t;}}if(cur)lines.push(cur);return lines;}
  function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
  function getLevelHex(l){return l==='A'?'#2D8B57':l==='B'?'#2E75B6':l==='C'?'#E67E22':'#CC4444';}
  function getBarHex(p){return p>=60?'#2D8B57':p>=40?'#E67E22':'#CC4444';}
})();
