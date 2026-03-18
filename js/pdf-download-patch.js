// ============================================================
// DX診断結果 PDFダウンロード機能 v6
// ゆったりレイアウト版
// ============================================================
(function() {
  'use strict';

  var _resultData = null;
  var _jspdfLoaded = false;
  var _orig = window.showResults;

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
    var level, levelMsg;
    if (totalPct >= 80) { level = 'A'; levelMsg = 'DX先進企業です。さらなる高度化を目指しましょう。'; }
    else if (totalPct >= 60) { level = 'B'; levelMsg = '基礎は整っています。データ活用・AI導入で次のステージへ。'; }
    else if (totalPct >= 40) { level = 'C'; levelMsg = 'DXの入り口に立っています。まずは業務のデジタル化から。'; }
    else { level = 'D'; levelMsg = 'DXの第一歩を踏み出しましょう。無料DX診断で具体的な計画を。'; }
    var sorted = catScores.slice().sort(function(a, b) { return a.pct - b.pct; });
    var actionTexts = {
      "業務プロセス": "業務手順書の作成と、紙業務のデジタル移行から着手。Googleフォーム等の無料ツールで始められます。",
      "データ管理": "まず顧客・売上データの一元管理を。Googleスプレッドシートでの管理テンプレートをご提供可能です。",
      "データ活用": "月次KPI（売上・客数・客単価・リピート率）の可視化から。スターエイトの経営スコアカードがお役に立てます。",
      "ITツール活用": "Google Workspace等のクラウドツール導入を推奨。初期設定・移行をサポートします。",
      "セキュリティ": "パスワードポリシーの策定と、個人情報取扱いルールの文書化を最優先で。",
      "AI活用": "まずはChatGPTで議事録作成やメール文面生成から試しましょう。業務別の活用ガイドを提供可能です。",
      "DX推進体制": "DX推進の担当者を決め、年間予算を設定することが第一歩。スターエイトのDX顧問がサポートします。"
    };
    _resultData = {
      totalPct: totalPct, level: level, levelMsg: levelMsg,
      catScores: catScores, sorted: sorted, actionTexts: actionTexts
    };
    _orig.apply(this, arguments);
    injectPdfButton();
  };

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
    btn.onmouseenter = function() { this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 6px 20px rgba(26,82,118,0.4)'; };
    btn.onmouseleave = function() { this.style.transform = ''; this.style.boxShadow = '0 4px 14px rgba(26,82,118,0.3)'; };
    btn.onclick = onClickPdf;
    if (ctaBanner) ctaBanner.parentNode.insertBefore(container, ctaBanner);
    else results.appendChild(container);
  }

  function loadJsPdf(callback) {
    if (_jspdfLoaded && window.jspdf) { callback(); return; }
    var urls = [
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js',
      'https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js'
    ];
    function tryLoad(idx) {
      if (idx >= urls.length) { callback(new Error('jsPDFの読み込みに失敗しました。インターネット接続を確認してください。')); return; }
      var s = document.createElement('script');
      s.src = urls[idx];
      s.onload = function() { if (window.jspdf) { _jspdfLoaded = true; callback(); } else { tryLoad(idx + 1); } };
      s.onerror = function() { tryLoad(idx + 1); };
      document.head.appendChild(s);
    }
    if (window.jspdf) { _jspdfLoaded = true; callback(); return; }
    tryLoad(0);
  }

  function onClickPdf() {
    if (!_resultData) return;
    var btn = document.getElementById('pdfDownloadBtn');
    var origHTML = btn.innerHTML;
    btn.disabled = true;
    btn.style.opacity = '0.7';
    btn.innerHTML = 'ライブラリ読み込み中...';
    loadJsPdf(function(err) {
      if (err) { alert(err.message); btn.innerHTML = origHTML; btn.style.opacity = '1'; btn.disabled = false; return; }
      btn.innerHTML = 'PDF生成中...';
      setTimeout(function() { generatePdf(btn, origHTML); }, 50);
    });
  }

  function generatePdf(btn, origHTML) {
    try {
      var data = _resultData;
      var d = new Date();
      var ds = d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');

      var W = 840;
      var DPR = 2;
      var canvas = document.createElement('canvas');
      canvas.width = W * DPR;
      var ctx = canvas.getContext('2d');
      ctx.scale(DPR, DPR);
      var totalH = drawContent(ctx, W, data, ds, true);
      canvas.height = totalH * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, totalH);
      drawContent(ctx, W, data, ds, false);

      var pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
      var pw = 210, ph = 297, margin = 8;
      var contentW = pw - margin * 2;
      var imgData = canvas.toDataURL('image/png');
      var imgH = (canvas.height / canvas.width) * contentW;

      if (imgH <= ph - margin * 2) {
        pdf.addImage(imgData, 'PNG', margin, margin, contentW, imgH);
      } else {
        var srcY = 0, pageNum = 0;
        while (srcY < canvas.height) {
          if (pageNum > 0) pdf.addPage();
          var availH = ph - margin * 2;
          var slicePx = (availH / contentW) * canvas.width;
          slicePx = Math.min(slicePx, canvas.height - srcY);
          var sc = document.createElement('canvas');
          sc.width = canvas.width;
          sc.height = slicePx;
          sc.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, slicePx, 0, 0, sc.width, sc.height);
          pdf.addImage(sc.toDataURL('image/png'), 'PNG', margin, margin, contentW, (slicePx / canvas.width) * contentW);
          srcY += slicePx;
          pageNum++;
        }
      }

      var pages = pdf.internal.getNumberOfPages();
      for (var p = 1; p <= pages; p++) {
        pdf.setPage(p);
        pdf.setFontSize(7);
        pdf.setTextColor(160, 160, 160);
        pdf.text('StarEight LLC | https://stareight-dx-site.pages.dev', pw / 2, ph - 4, { align: 'center' });
        pdf.text(p + '/' + pages, pw - margin, ph - 4, { align: 'right' });
      }

      pdf.save('DX_Diagnosis_' + ds.replace(/\//g, '') + '.pdf');

      btn.innerHTML = '✓ ダウンロード完了！';
      btn.style.background = 'linear-gradient(135deg,#27ae60 0%,#2ecc71 100%)';
      btn.style.opacity = '1';
      setTimeout(function() { btn.innerHTML = origHTML; btn.style.background = 'linear-gradient(135deg,#1a5276 0%,#2980b9 100%)'; btn.disabled = false; }, 2500);

    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF生成エラー: ' + err.message);
      btn.innerHTML = origHTML;
      btn.style.background = 'linear-gradient(135deg,#1a5276 0%,#2980b9 100%)';
      btn.style.opacity = '1';
      btn.disabled = false;
    }
  }

  // ====== Canvas描画 ======
  function drawContent(ctx, W, data, dateStr, dryRun) {
    var FONT = '"Noto Sans JP","Hiragino Sans","Hiragino Kaku Gothic ProN","Meiryo",sans-serif';
    var PAD = 50;
    var CW = W - PAD * 2;
    var y = 0;

    // ===== ヘッダー帯 =====
    var headerH = 90;
    if (!dryRun) {
      ctx.fillStyle = '#1a5276';
      ctx.fillRect(0, 0, W, headerH);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px ' + FONT;
      ctx.fillText('★ StarEight DX Consulting', PAD, 35);
      ctx.font = 'bold 26px ' + FONT;
      ctx.fillText('DX診断レポート', PAD, 65);
      ctx.font = '13px ' + FONT;
      ctx.textAlign = 'right';
      ctx.fillText('診断日：' + dateStr, W - PAD, 65);
      ctx.textAlign = 'left';
    }
    y = headerH + 40;

    // ===== 総合スコア =====
    var cx = W / 2;
    var lc = getLevelHex(data.level);
    var circleR = 62;
    if (!dryRun) {
      // 背景の薄い円
      ctx.beginPath();
      ctx.arc(cx, y + circleR, circleR + 4, 0, Math.PI * 2);
      ctx.fillStyle = '#f5f5f5';
      ctx.fill();
      // メイン円
      ctx.beginPath();
      ctx.arc(cx, y + circleR, circleR, 0, Math.PI * 2);
      ctx.strokeStyle = lc;
      ctx.lineWidth = 6;
      ctx.stroke();
      // スコア数値
      ctx.fillStyle = lc;
      ctx.font = 'bold 56px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText(String(data.totalPct), cx, y + circleR + 12);
      ctx.fillStyle = '#999999';
      ctx.font = '15px ' + FONT;
      ctx.fillText('/ 100点', cx, y + circleR + 34);
    }
    y += circleR * 2 + 30;

    // DXレベル
    if (!dryRun) {
      ctx.fillStyle = lc;
      ctx.font = 'bold 26px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('DXレベル：' + data.level, cx, y);
    }
    y += 22;
    if (!dryRun) {
      ctx.fillStyle = '#777777';
      ctx.font = '15px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText(data.levelMsg, cx, y);
      ctx.textAlign = 'left';
    }
    y += 50;

    // ===== カテゴリ別スコア =====
    if (!dryRun) {
      ctx.fillStyle = '#1a5276';
      ctx.font = 'bold 20px ' + FONT;
      ctx.fillText('カテゴリ別スコア', PAD, y);
      // 下線
      ctx.fillStyle = '#2980b9';
      ctx.fillRect(PAD, y + 6, 160, 3);
    }
    y += 30;

    data.catScores.forEach(function(c) {
      var bc = getBarHex(c.pct);
      if (!dryRun) {
        // カテゴリ名
        ctx.fillStyle = '#333333';
        ctx.font = '15px ' + FONT;
        ctx.textAlign = 'left';
        ctx.fillText(c.icon + '  ' + c.name, PAD, y);
        // スコア
        ctx.fillStyle = bc;
        ctx.font = 'bold 16px ' + FONT;
        ctx.textAlign = 'right';
        ctx.fillText(c.pct + '点', W - PAD, y);
        ctx.textAlign = 'left';
      }
      y += 10;
      if (!dryRun) {
        // バー背景
        ctx.fillStyle = '#eeeeee';
        roundRect(ctx, PAD, y, CW, 10, 5); ctx.fill();
        // バー実績
        if (c.pct > 0) {
          ctx.fillStyle = bc;
          roundRect(ctx, PAD, y, Math.max(10, (c.pct / 100) * CW), 10, 5); ctx.fill();
        }
      }
      y += 30;
    });

    y += 20;

    // ===== TOP3 アクション =====
    if (!dryRun) {
      ctx.fillStyle = '#1a5276';
      ctx.font = 'bold 20px ' + FONT;
      ctx.fillText('まず取り組むべきDXアクション TOP3', PAD, y);
      ctx.fillStyle = '#2980b9';
      ctx.fillRect(PAD, y + 6, 320, 3);
    }
    y += 32;

    for (var i = 0; i < 3 && i < data.sorted.length; i++) {
      var cat = data.sorted[i];
      var actionText = data.actionTexts[cat.name] || '';

      // カード背景
      var cardFont = '14px ' + FONT;
      var lines = wrapText(ctx, actionText, CW - 60, cardFont);
      var cardH = 38 + lines.length * 20 + 16;

      if (!dryRun) {
        // カード
        ctx.fillStyle = '#f8fafb';
        roundRect(ctx, PAD, y, CW, cardH, 8); ctx.fill();
        ctx.strokeStyle = '#e0e8ef';
        ctx.lineWidth = 1;
        roundRect(ctx, PAD, y, CW, cardH, 8); ctx.stroke();
        // 左側の色バー
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(PAD, y + 8, 4, cardH - 16);
      }

      var innerX = PAD + 20;
      var innerY = y + 24;

      if (!dryRun) {
        // ACTION番号 + カテゴリ名
        ctx.fillStyle = '#2980b9';
        ctx.font = 'bold 14px ' + FONT;
        ctx.fillText('ACTION ' + (i + 1) + '：' + cat.icon + ' ' + cat.name + '（現在 ' + cat.pct + '点）', innerX, innerY);
      }
      innerY += 22;

      if (!dryRun) {
        ctx.fillStyle = '#555555';
        ctx.font = cardFont;
        lines.forEach(function(line) {
          ctx.fillText(line, innerX, innerY);
          innerY += 20;
        });
      }

      y += cardH + 14;
    }

    y += 30;

    // ===== CTA帯 =====
    var ctaH = 80;
    if (!dryRun) {
      ctx.fillStyle = '#1a5276';
      roundRect(ctx, PAD, y, CW, ctaH, 10); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 17px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('この診断結果をもとに、具体的な改善プランを無料でご提案します', cx, y + 32);
      ctx.font = '13px ' + FONT;
      ctx.fillStyle = '#b0d4f1';
      ctx.fillText('スターエイトのDXコンサルタントが、御社の状況に合わせた改善計画を策定します。', cx, y + 54);
      ctx.font = '12px ' + FONT;
      ctx.fillStyle = '#ffffff';
      ctx.fillText('https://stareight-dx-site.pages.dev/contact.html', cx, y + 72);
      ctx.textAlign = 'left';
    }
    y += ctaH + 30;

    // フッター
    if (!dryRun) {
      ctx.fillStyle = '#bbbbbb';
      ctx.font = '11px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('© 2026 StarEight LLC. All rights reserved.', cx, y);
      ctx.textAlign = 'left';
    }
    y += 30;

    return y;
  }

  // ユーティリティ
  function wrapText(ctx, text, maxW, font) {
    ctx.font = font;
    var lines = [], cur = '';
    for (var i = 0; i < text.length; i++) {
      var test = cur + text[i];
      if (ctx.measureText(test).width > maxW && cur.length > 0) { lines.push(cur); cur = text[i]; }
      else { cur = test; }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function getLevelHex(l) { return l === 'A' ? '#2D8B57' : l === 'B' ? '#2E75B6' : l === 'C' ? '#E67E22' : '#CC4444'; }
  function getBarHex(p) { return p >= 60 ? '#2D8B57' : p >= 40 ? '#E67E22' : '#CC4444'; }

})();
