// ============================================================
// DX診断結果 PDF + 無料相談連携 v9
// PDF = ダウンロード専用 / 無料相談 = テキストデータ送信
// ============================================================
(function() {
  'use strict';

  var _resultData = null;
  var _jspdfLoaded = false;
  var _orig = window.showResults;
  var _diagStartTime = null;

  // 診断開始時刻を記録
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
      return { name: cat.name, icon: cat.icon, score: total, max: maxScore, pct: Math.round((total / maxScore) * 100) };
    });
    var totalScore = 0, totalMax = 0;
    catScores.forEach(function(c) { totalScore += c.score; totalMax += c.max; });
    var totalPct = Math.round((totalScore / totalMax) * 100);
    var level, levelName, levelMsg;
    if (totalPct >= 80) { level = 'A'; levelName = '発展活用期'; levelMsg = 'DXの基盤はかなり整っています。データ活用やAI活用をさらに実務へ定着させることで、より高い成果につなげやすい状態です。'; }
    else if (totalPct >= 60) { level = 'B'; levelName = '基礎整備期'; levelMsg = 'DXの土台はできつつありますが、改善余地も見られます。優先順位をつけて取り組むことで、業務効率や意思決定の質をさらに高められます。'; }
    else if (totalPct >= 40) { level = 'C'; levelName = '改善着手期'; levelMsg = '複数のテーマで課題が見られます。ただし、すべてを一度に進める必要はありません。効果が出やすいテーマから順に進めるのがおすすめです。'; }
    else { level = 'D'; levelName = '初期段階'; levelMsg = 'DXはこれから整備していく段階です。まずは現状の課題を整理し、何から始めるべきかを明確にすることが重要です。'; }
    var sorted = catScores.slice().sort(function(a, b) { return a.pct - b.pct; });
    var actionTexts = {
      "業務プロセス": "手順の整理と繰り返し業務の見直しから始めましょう。",
      "データ管理": "売上・経費・顧客データを、見やすく整理・統合するところから始めましょう。",
      "データ活用": "売上・顧客・KPIの分析結果を、具体的な改善行動につなげる仕組みを整えましょう。",
      "業務の見える化": "売上・利益・KPIを一画面で確認できる状態を目指しましょう。",
      "業務の標準化・効率化": "属人化の解消と、日常業務の効率化から優先して進めましょう。",
      "AI活用": "AIを\u201c試して終わり\u201dにせず、日常業務に組み込むテーマを決めましょう。",
      "DX推進体制": "優先順位、担当、進め方を整理し、継続して進められる体制を整えましょう。"
    };

    // サービスTOP3計算
    var svcMap = {
      "Excel業務改善": [1,2,3,5,7,14,16,17],
      "データ可視化": [4,5,6,7,8,9,12],
      "データ分析": [8,10,11,22],
      "生成AI活用支援": [13,19,20,21,22,23],
      "DX改善プラン策定": [0,13,14,15,16,17,18,26,28,29],
      "DX顧問": [11,15,24,25,26,27,28,29]
    };
    var svcRank = [];
    Object.keys(svcMap).forEach(function(name) {
      var qIdxs = svcMap[name];
      var issueScore = 0;
      qIdxs.forEach(function(qi) { issueScore += (2 - (answers[qi] || 0)); });
      svcRank.push({ name: name, avg: issueScore / qIdxs.length, count: qIdxs.length });
    });
    svcRank.sort(function(a,b) { return b.avg - a.avg || a.count - b.count; });
    var svcTop3 = svcRank.slice(0, 3);

    _resultData = {
      totalPct: totalPct, level: level, levelName: levelName, levelMsg: levelMsg,
      catScores: catScores, sorted: sorted, actionTexts: actionTexts,
      svcTop3: svcTop3, allAnswers: answers.slice()
    };
    _orig.apply(this, arguments);

    // ====== GASスプレッドシートに診断結果を自動送信 ======
    sendToGAS(_resultData);

    rewriteCtaLink();
    injectPdfButton();
  };

  // ====== GASスプレッドシートに診断結果を送信 ======
  var GAS_URL = 'https://script.google.com/macros/s/AKfycbxJi_DMG0HpJftAFnS9V1LkAqaTPq9s3pZ08nCKWYwVqC3tcPRUplGB6bxoXrJNUUvP/exec';

  function sendToGAS(data) {
    try {
      var now = new Date();
      var diagId = 'DX-' + now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + '-' +
        String(Math.floor(Math.random() * 10000)).padStart(4, '0');

      var catScoreStr = data.catScores.map(function(c) {
        return c.name + ':' + c.pct + '点';
      }).join(', ');

      var top3Str = data.sorted.slice(0, 3).map(function(c, i) {
        return (i + 1) + '.' + c.name + '(' + c.pct + '点)';
      }).join(', ');

      // カテゴリ別スコアを個別フィールドとして構築
      var catFields = {};
      data.catScores.forEach(function(c) {
        catFields[c.name] = c.pct + '点';
      });

      var payload = {
        diagId: diagId,
        timestamp: now.toISOString(),
        score: data.totalPct,
        level: data.levelName || ('Level ' + data.level),
        cat_業務プロセス: catFields['業務プロセス'] || '',
        cat_データ管理: catFields['データ管理'] || '',
        cat_データ活用: catFields['データ活用'] || '',
        cat_業務の見える化: catFields['業務の見える化'] || '',
        cat_標準化効率化: catFields['業務の標準化・効率化'] || '',
        cat_AI活用: catFields['AI活用'] || '',
        cat_DX推進体制: catFields['DX推進体制'] || '',
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

      // diagIdをページに保存（contact.htmlで参照可能にする）
      window.__diagId = diagId;
      window.__diagScore = data.totalPct;
      window.__diagLevel = data.level;

      // GASへ送信（隠しフォームPOSTで確実に送信）
      var iframe = document.createElement('iframe');
      iframe.name = '__gasFrame';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      var form = document.createElement('form');
      form.method = 'POST';
      form.action = GAS_URL;
      form.target = '__gasFrame';
      form.style.display = 'none';

      Object.keys(payload).forEach(function(k) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = k;
        input.value = payload[k];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      setTimeout(function() { form.remove(); iframe.remove(); }, 10000);

      console.log('DX診断データ送信完了: ' + diagId);
    } catch (e) {
      console.log('GAS送信スキップ:', e);
    }
  }

  // ====== CTAリンクに診断データを付与 ======
  function rewriteCtaLink() {
    var results = document.getElementById('diag-results');
    if (!results || !_resultData) return;
    var d = _resultData;
    var params = new URLSearchParams();
    params.set('from', 'diagnosis');
    params.set('score', d.totalPct);
    params.set('level', d.level);
    params.set('cats', d.catScores.map(function(c) { return c.name + ':' + c.pct; }).join(','));
    params.set('top3', d.sorted.slice(0, 3).map(function(c) { return c.name; }).join(','));
    var contactUrl = 'contact.html?' + params.toString();
    results.querySelectorAll('a[href="contact.html"]').forEach(function(a) { a.href = contactUrl; });
  }

  // ====== PDFダウンロードボタン ======
  function injectPdfButton() {
    var results = document.getElementById('diag-results');
    if (!results || document.getElementById('pdfDownloadBtn')) return;
    var ctaBanner = results.querySelector('.cta-banner');
    var container = document.createElement('div');
    container.style.cssText = 'text-align:center; margin: 32px 0;';
    container.innerHTML =
      '<button id="pdfDownloadBtn" style="' +
        'display:inline-flex;align-items:center;gap:8px;padding:14px 32px;' +
        'background:linear-gradient(135deg,#1a5276 0%,#2980b9 100%);' +
        'color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:600;' +
        'cursor:pointer;box-shadow:0 4px 14px rgba(26,82,118,0.3);transition:all 0.3s ease;">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
          '<polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>' +
        '</svg>診断結果をPDFでダウンロード</button>' +
      '<p style="margin-top:8px;font-size:13px;color:#888;">保存して後から見返すことができます</p>';
    var btn = container.querySelector('button');
    btn.onmouseenter = function() { this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(26,82,118,0.4)'; };
    btn.onmouseleave = function() { this.style.transform=''; this.style.boxShadow='0 4px 14px rgba(26,82,118,0.3)'; };
    btn.onclick = onClickPdf;
    if (ctaBanner) ctaBanner.parentNode.insertBefore(container, ctaBanner);
    else results.appendChild(container);
  }

  // ====== jsPDF動的ロード ======
  function loadJsPdf(callback) {
    if (_jspdfLoaded && window.jspdf) { callback(); return; }
    var urls = [
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js',
      'https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js'
    ];
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
        } catch (e) {
          console.error('PDF error:', e); alert('PDF生成エラー: ' + e.message);
          btn.innerHTML = origHTML; btn.style.background = 'linear-gradient(135deg,#1a5276 0%,#2980b9 100%)'; btn.style.opacity = '1'; btn.disabled = false;
        }
      }, 50);
    });
  }

  // ====== PDF Blob生成 ======
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
      pdf.text('StarEight LLC | https://stareight-dx-site.pages.dev', pw/2, ph-4, {align:'center'});
      pdf.text(p+'/'+pages, pw-margin, ph-4, {align:'right'});
    }
    return pdf.output('blob');
  }

  // ====== Canvas描画（v6ゆったり版） ======
  function drawContent(ctx, W, data, dateStr, dryRun) {
    var FONT = '"Noto Sans JP","Hiragino Sans","Hiragino Kaku Gothic ProN","Meiryo",sans-serif';
    var PAD = 50, CW = W - PAD * 2, y = 0, headerH = 90;
    if (!dryRun) { ctx.fillStyle='#1a5276'; ctx.fillRect(0,0,W,headerH); ctx.fillStyle='#fff'; ctx.font='bold 15px '+FONT; ctx.fillText('★ StarEight DX Consulting',PAD,35); ctx.font='bold 26px '+FONT; ctx.fillText('DX診断レポート',PAD,65); ctx.font='13px '+FONT; ctx.textAlign='right'; ctx.fillText('診断日：'+dateStr,W-PAD,65); ctx.textAlign='left'; }
    y=headerH+50;
    var cx=W/2, lc=getLevelHex(data.level), circleR=62;
    if(!dryRun){ ctx.beginPath();ctx.arc(cx,y+circleR,circleR+4,0,Math.PI*2);ctx.fillStyle='#f5f5f5';ctx.fill(); ctx.beginPath();ctx.arc(cx,y+circleR,circleR,0,Math.PI*2);ctx.strokeStyle=lc;ctx.lineWidth=6;ctx.stroke(); ctx.fillStyle=lc;ctx.font='bold 56px '+FONT;ctx.textAlign='center';ctx.fillText(String(data.totalPct),cx,y+circleR+12); ctx.fillStyle='#999';ctx.font='15px '+FONT;ctx.fillText('/ 100点',cx,y+circleR+34); }
    y+=circleR*2+35;
    if(!dryRun){ctx.fillStyle=lc;ctx.font='bold 26px '+FONT;ctx.textAlign='center';ctx.fillText('DXレベル：'+(data.levelName||data.level),cx,y);}
    y+=22;
    if(!dryRun){ctx.fillStyle='#777';ctx.font='15px '+FONT;ctx.textAlign='center';var lvLines=wrapText(ctx,data.levelMsg,CW-40,'15px '+FONT);lvLines.forEach(function(l){ctx.fillText(l,cx,y);y+=20;});ctx.textAlign='left';}
    y+=30;
    if(!dryRun){ctx.fillStyle='#1a5276';ctx.font='bold 20px '+FONT;ctx.fillText('カテゴリ別スコア',PAD,y);ctx.fillStyle='#2980b9';ctx.fillRect(PAD,y+6,160,3);}
    y+=30;
    data.catScores.forEach(function(c){ var bc=getBarHex(c.pct); if(!dryRun){ctx.fillStyle='#333';ctx.font='15px '+FONT;ctx.textAlign='left';ctx.fillText(c.icon+'  '+c.name,PAD,y);ctx.fillStyle=bc;ctx.font='bold 16px '+FONT;ctx.textAlign='right';ctx.fillText(c.pct+'点',W-PAD,y);ctx.textAlign='left';} y+=10; if(!dryRun){ctx.fillStyle='#eee';roundRect(ctx,PAD,y,CW,10,5);ctx.fill();if(c.pct>0){ctx.fillStyle=bc;roundRect(ctx,PAD,y,Math.max(10,(c.pct/100)*CW),10,5);ctx.fill();}} y+=35; });
    y+=25;
    if(!dryRun){ctx.fillStyle='#1a5276';ctx.font='bold 20px '+FONT;ctx.fillText('まず取り組むべきDXアクション TOP3',PAD,y);ctx.fillStyle='#2980b9';ctx.fillRect(PAD,y+6,320,3);}
    y+=32;
    for(var i=0;i<3&&i<data.sorted.length;i++){ var cat=data.sorted[i],actionText=data.actionTexts[cat.name]||''; var cardFont='14px '+FONT,lines=wrapText(ctx,actionText,CW-60,cardFont),cardH=38+lines.length*20+16; if(!dryRun){ctx.fillStyle='#f8fafb';roundRect(ctx,PAD,y,CW,cardH,8);ctx.fill();ctx.strokeStyle='#e0e8ef';ctx.lineWidth=1;roundRect(ctx,PAD,y,CW,cardH,8);ctx.stroke();ctx.fillStyle='#2980b9';ctx.fillRect(PAD,y+8,4,cardH-16);} var ix=PAD+20,iy=y+24; if(!dryRun){ctx.fillStyle='#2980b9';ctx.font='bold 14px '+FONT;ctx.fillText('ACTION '+(i+1)+'：'+cat.icon+' '+cat.name+'（現在 '+cat.pct+'点）',ix,iy);} iy+=22; if(!dryRun){ctx.fillStyle='#555';ctx.font=cardFont;lines.forEach(function(l){ctx.fillText(l,ix,iy);iy+=20;});} y+=cardH+18; }
    y+=35;
    // ====== 御社の課題に対応しやすい支援例 TOP3 ======
    if(data.svcTop3 && data.svcTop3.length > 0){
      if(!dryRun){ctx.fillStyle='#1a5276';ctx.font='bold 20px '+FONT;ctx.fillText('御社の課題に対応しやすい支援例 TOP3',PAD,y);ctx.fillStyle='#2980b9';ctx.fillRect(PAD,y+6,340,3);}
      y+=32;
      var svcDescs={"Excel業務改善":"Excelの集計・転記・レポート作成など、手作業の多い業務を効率化したい会社向けです。","データ可視化":"売上・利益・KPIなどの数字を見える化し、経営判断をしやすくしたい会社向けです。","データ分析":"売上や顧客データを分析し、改善アクションにつなげたい会社向けです。","生成AI活用支援":"ChatGPTやClaudeなどの生成AIを、実際の業務で使える形にしたい会社向けです。","DX改善プラン策定":"課題が複数にまたがっていて、何から始めるべきか整理したい会社向けです。","DX顧問":"継続的にDXを進めたいが、社内だけでは進めにくい会社向けです。"};
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
      if(!dryRun){ctx.fillStyle='#aaa';ctx.font='11px '+FONT;ctx.fillText('※上記は診断結果をもとにした一般的なご提案です。実際の進め方は、業種や業務内容に応じて異なります。',PAD,y);}
      y+=30;
    }
    if(!dryRun){ctx.fillStyle='#1a5276';roundRect(ctx,PAD,y,CW,80,10);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 17px '+FONT;ctx.textAlign='center';ctx.fillText('診断結果をもとに、何から始めるべきか整理しませんか？',cx,y+32);ctx.fillStyle='#b0d4f1';ctx.font='13px '+FONT;ctx.fillText('スターエイトでは、診断結果をふまえて、優先順位と次の一歩を一緒に整理します。',cx,y+54);ctx.fillStyle='#fff';ctx.font='12px '+FONT;ctx.fillText('https://stareight-dx-site.pages.dev/contact.html',cx,y+72);ctx.textAlign='left';}
    y+=110;
    if(!dryRun){ctx.fillStyle='#bbb';ctx.font='11px '+FONT;ctx.textAlign='center';ctx.fillText('© 2026 StarEight LLC. All rights reserved.',cx,y);ctx.textAlign='left';}
    y+=30; return y;
  }
  function wrapText(ctx,text,maxW,font){ctx.font=font;var lines=[],cur='';for(var i=0;i<text.length;i++){var t=cur+text[i];if(ctx.measureText(t).width>maxW&&cur.length>0){lines.push(cur);cur=text[i];}else{cur=t;}}if(cur)lines.push(cur);return lines;}
  function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
  function getLevelHex(l){return l==='A'?'#2D8B57':l==='B'?'#2E75B6':l==='C'?'#E67E22':'#CC4444';}
  function getBarHex(p){return p>=60?'#2D8B57':p>=40?'#E67E22':'#CC4444';}
})();
