// ============================================================
// DX診断結果 PDFダウンロード機能 v5
// jsPDFを動的ロード＋Canvas自前描画（日本語完全対応）
// diagnosis.html の </body> 直前で読み込む
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

  // --- jsPDFを動的に読み込み ---
  function loadJsPdf(callback) {
    if (_jspdfLoaded && window.jspdf) { callback(); return; }

    var urls = [
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js',
      'https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js'
    ];

    function tryLoad(idx) {
      if (idx >= urls.length) {
        callback(new Error('jsPDFの読み込みに失敗しました。インターネット接続を確認してください。'));
        return;
      }
      var s = document.createElement('script');
      s.src = urls[idx];
      s.onload = function() {
        if (window.jspdf) {
          _jspdfLoaded = true;
          callback();
        } else {
          tryLoad(idx + 1);
        }
      };
      s.onerror = function() { tryLoad(idx + 1); };
      document.head.appendChild(s);
    }

    // 既にグローバルにある場合
    if (window.jspdf) { _jspdfLoaded = true; callback(); return; }
    tryLoad(0);
  }

  // --- ボタンクリック ---
  function onClickPdf() {
    if (!_resultData) return;

    var btn = document.getElementById('pdfDownloadBtn');
    var origHTML = btn.innerHTML;
    btn.disabled = true;
    btn.style.opacity = '0.7';
    btn.innerHTML = 'ライブラリ読み込み中...';

    loadJsPdf(function(err) {
      if (err) {
        alert(err.message);
        btn.innerHTML = origHTML;
        btn.style.opacity = '1';
        btn.disabled = false;
        return;
      }
      btn.innerHTML = 'PDF生成中...';
      // 少し待ってからPDF生成（UIを更新させるため）
      setTimeout(function() { generatePdf(btn, origHTML); }, 50);
    });
  }

  // --- PDF生成 ---
  function generatePdf(btn, origHTML) {
    try {
      var data = _resultData;
      var d = new Date();
      var ds = d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');

      // Canvas作成
      var W = 800;
      var DPR = 2;
      var canvas = document.createElement('canvas');
      canvas.width = W * DPR;
      var ctx = canvas.getContext('2d');
      ctx.scale(DPR, DPR);

      // 高さ計算（ドライラン）
      var totalH = drawContent(ctx, W, data, ds, true);
      canvas.height = totalH * DPR;

      // リセットして本描画
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, totalH);
      drawContent(ctx, W, data, ds, false);

      // jsPDFに変換
      var pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
      var pw = 210, ph = 297, margin = 10;
      var contentW = pw - margin * 2;
      var imgData = canvas.toDataURL('image/png');
      var imgH = (canvas.height / canvas.width) * contentW;

      if (imgH <= ph - margin * 2) {
        pdf.addImage(imgData, 'PNG', margin, margin, contentW, imgH);
      } else {
        var srcY = 0;
        var pageNum = 0;
        while (srcY < canvas.height) {
          if (pageNum > 0) pdf.addPage();
          var availH = ph - margin * 2;
          var slicePx = (availH / contentW) * canvas.width;
          slicePx = Math.min(slicePx, canvas.height - srcY);

          var sc = document.createElement('canvas');
          sc.width = canvas.width;
          sc.height = slicePx;
          sc.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, slicePx, 0, 0, sc.width, sc.height);
          var sH = (slicePx / canvas.width) * contentW;
          pdf.addImage(sc.toDataURL('image/png'), 'PNG', margin, margin, contentW, sH);
          srcY += slicePx;
          pageNum++;
        }
      }

      // ページフッター
      var pages = pdf.internal.getNumberOfPages();
      for (var p = 1; p <= pages; p++) {
        pdf.setPage(p);
        pdf.setFontSize(7);
        pdf.setTextColor(160, 160, 160);
        pdf.text('StarEight LLC | https://stareight-dx-site.pages.dev', pw / 2, ph - 5, { align: 'center' });
        pdf.text(p + '/' + pages, pw - margin, ph - 5, { align: 'right' });
      }

      pdf.save('DX_Diagnosis_' + ds.replace(/\//g, '') + '.pdf');

      // 成功
      btn.innerHTML = '✓ ダウンロード完了！';
      btn.style.background = 'linear-gradient(135deg,#27ae60 0%,#2ecc71 100%)';
      btn.style.opacity = '1';
      setTimeout(function() {
        btn.innerHTML = origHTML;
        btn.style.background = 'linear-gradient(135deg,#1a5276 0%,#2980b9 100%)';
        btn.disabled = false;
      }, 2500);

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
    var FONT = '"Noto Sans JP","Hiragino Sans","Hiragino Kaku Gothic ProN","Meiryo","Yu Gothic",sans-serif';
    var PAD = 40;
    var CW = W - PAD * 2;
    var y = 0;

    // ヘッダー帯
    if (!dryRun) {
      ctx.fillStyle = '#1a5276';
      ctx.fillRect(0, 0, W, 80);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px ' + FONT;
      ctx.fillText('★ StarEight DX Consulting', PAD, 30);
      ctx.font = 'bold 22px ' + FONT;
      ctx.fillText('DX診断レポート', PAD, 58);
      ctx.font = '12px ' + FONT;
      ctx.textAlign = 'right';
      ctx.fillText(dateStr, W - PAD, 58);
      ctx.textAlign = 'left';
    }
    y = 100;

    // 総合スコア円
    var cx = W / 2;
    var lc = getLevelHex(data.level);
    if (!dryRun) {
      ctx.beginPath();
      ctx.arc(cx, y + 50, 50, 0, Math.PI * 2);
      ctx.strokeStyle = lc;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.fillStyle = lc;
      ctx.font = 'bold 48px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText(String(data.totalPct), cx, y + 58);
      ctx.fillStyle = '#888888';
      ctx.font = '14px ' + FONT;
      ctx.fillText('/ 100点', cx, y + 78);
    }
    y += 115;

    // DXレベル
    if (!dryRun) {
      ctx.fillStyle = lc;
      ctx.font = 'bold 22px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('DXレベル：' + data.level, cx, y);
    }
    y += 12;
    if (!dryRun) {
      ctx.fillStyle = '#666666';
      ctx.font = '13px ' + FONT;
      ctx.fillText(data.levelMsg, cx, y + 8);
      ctx.textAlign = 'left';
    }
    y += 36;

    // 区切り線
    if (!dryRun) { drawLine(ctx, PAD, y, W - PAD); }
    y += 16;

    // カテゴリ別スコア
    if (!dryRun) {
      ctx.fillStyle = '#222222';
      ctx.font = 'bold 17px ' + FONT;
      ctx.fillText('カテゴリ別スコア', PAD, y);
    }
    y += 20;

    data.catScores.forEach(function(c) {
      var bc = getBarHex(c.pct);
      if (!dryRun) {
        ctx.fillStyle = '#444444';
        ctx.font = '14px ' + FONT;
        ctx.textAlign = 'left';
        ctx.fillText(c.icon + ' ' + c.name, PAD, y);
        ctx.fillStyle = bc;
        ctx.font = 'bold 14px ' + FONT;
        ctx.textAlign = 'right';
        ctx.fillText(c.pct + '点', W - PAD, y);
        ctx.textAlign = 'left';
      }
      y += 8;
      if (!dryRun) {
        ctx.fillStyle = '#e8e8e8';
        roundRect(ctx, PAD, y, CW, 8, 4); ctx.fill();
        if (c.pct > 0) {
          ctx.fillStyle = bc;
          roundRect(ctx, PAD, y, Math.max(8, (c.pct / 100) * CW), 8, 4); ctx.fill();
        }
      }
      y += 22;
    });

    y += 8;
    if (!dryRun) { drawLine(ctx, PAD, y, W - PAD); }
    y += 16;

    // TOP3アクション
    if (!dryRun) {
      ctx.fillStyle = '#222222';
      ctx.font = 'bold 17px ' + FONT;
      ctx.fillText('まず取り組むべきDXアクション TOP3', PAD, y);
    }
    y += 20;

    for (var i = 0; i < 3 && i < data.sorted.length; i++) {
      var cat = data.sorted[i];
      var actionText = data.actionTexts[cat.name] || '';

      if (!dryRun) {
        ctx.fillStyle = '#2980b9';
        roundRect(ctx, PAD, y - 12, 22, 18, 4); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), PAD + 11, y);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#2980b9';
        ctx.font = 'bold 14px ' + FONT;
        ctx.fillText(cat.name + '（現在 ' + cat.pct + '点）', PAD + 28, y);
      }
      y += 14;

      var wrapFont = '13px ' + FONT;
      var lines = wrapText(ctx, actionText, CW - 28, wrapFont);
      if (!dryRun) {
        ctx.fillStyle = '#555555';
        ctx.font = wrapFont;
        lines.forEach(function(line) { ctx.fillText(line, PAD + 28, y); y += 18; });
      } else {
        y += lines.length * 18;
      }
      y += 12;
    }

    y += 12;

    // CTA帯
    if (!dryRun) {
      ctx.fillStyle = '#1a5276';
      roundRect(ctx, PAD, y, CW, 64, 8); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('この診断結果をもとに、具体的な改善プランを無料でご提案します', cx, y + 28);
      ctx.font = '11px ' + FONT;
      ctx.fillText('https://stareight-dx-site.pages.dev/contact.html', cx, y + 48);
      ctx.textAlign = 'left';
    }
    y += 64 + 16;

    if (!dryRun) {
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '10px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('© 2026 StarEight LLC. All rights reserved.', cx, y);
      ctx.textAlign = 'left';
    }
    y += 20;

    return y;
  }

  // ユーティリティ
  function wrapText(ctx, text, maxW, font) {
    ctx.font = font;
    var lines = [], cur = '';
    for (var i = 0; i < text.length; i++) {
      var test = cur + text[i];
      if (ctx.measureText(test).width > maxW && cur.length > 0) {
        lines.push(cur);
        cur = text[i];
      } else { cur = test; }
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

  function drawLine(ctx, x1, y, x2) {
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  }

  function getLevelHex(l) {
    return l === 'A' ? '#2D8B57' : l === 'B' ? '#2E75B6' : l === 'C' ? '#E67E22' : '#CC4444';
  }

  function getBarHex(p) {
    return p >= 60 ? '#2D8B57' : p >= 40 ? '#E67E22' : '#CC4444';
  }

})();
