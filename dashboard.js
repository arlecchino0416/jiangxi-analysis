// ====== 江西厂运营看板 JavaScript ======
Chart.register(ChartDataLabels);

const D = {};
const MON = ['1月','2月','3月','4月','5月'];
const REG = ['南昌大区','赣州大区','上饶大区','宜春大区'];
const COL = {'南昌大区':'#3498db','赣州大区':'#27ae60','上饶大区':'#e74c3c','宜春大区':'#f39c12'};

function rc(v) {
    return v >= 90 ? 'rate-good' : v >= 80 ? 'rate-mid' : 'rate-bad';
}
function pct(v) {
    return v.toFixed(1) + '%';
}

async function load() {
    const r = await fetch('data.json');
    Object.assign(D, await r.json());
    renderAll();
}

function renderAll() {
    renderHeader();
    renderBoss();
    renderOverview();
    renderCompletion();
    renderAbnormal();
    renderPa();
    renderPe();
    renderRecs();
}

// ========== HEADER ==========
function renderHeader() {
    const a = MON.reduce(function(s, m) {
        return { t: s.t + D.monthly[m].total, ok: s.ok + D.monthly[m].success };
    }, {t: 0, ok: 0});
    document.getElementById('headerStats').innerHTML =
        '<div class="stat-item"><div class="stat-value">' + a.t.toLocaleString() + '</div><div class="stat-label">累计拜访</div></div>' +
        '<div class="stat-item"><div class="stat-value">' + a.ok.toLocaleString() + '</div><div class="stat-label">累计成功</div></div>' +
        '<div class="stat-item"><div class="stat-value">' + (a.ok/a.t*100).toFixed(1) + '%</div><div class="stat-label">总完成率</div></div>' +
        '<div class="stat-item"><div class="stat-value">' + D.monthly['5月'].failed.toLocaleString() + '</div><div class="stat-label">5月异常</div></div>' +
        '<div class="stat-item"><div class="stat-value">' + D.error_types['5月_total'] + '</div><div class="stat-label">5月错误数</div></div>';
}

// ========== BOSS TABLE ==========
function renderBoss() {
    var d = D.monthly;
    var total = {t: 0, ok: 0, fail: 0};
    for (var mi = 0; mi < MON.length; mi++) {
        var m = MON[mi];
        total.t += d[m].total;
        total.ok += d[m].success;
        total.fail += d[m].failed;
    }
    var html = '<table class="boss-table"><thead><tr>' +
        '<th style="text-align:left;padding-left:18px;">月份</th><th>总拜访</th><th>完成</th><th>异常</th><th>完成率</th><th>异常率</th><th>二访无效</th><th>异常率环比</th>' +
        '</tr></thead><tbody>';
    for (var mi = 0; mi < MON.length; mi++) {
        var m = MON[mi];
        var x = d[m];
        var chg = mi > 0 ? x.abnormal_rate - d[MON[mi-1]].abnormal_rate : 0;
        var chgStr = chg > 0 ? '↑' + Math.abs(chg).toFixed(1) + '%' : (chg < 0 ? '↓' + Math.abs(chg).toFixed(1) + '%' : '—');
        var chgCls = chg > 0 ? 'boss-cell-bad' : (chg < 0 ? 'boss-cell-good' : '');
        html += '<tr>' +
            '<td style="text-align:left;padding-left:18px;">' + m + '</td>' +
            '<td>' + x.total.toLocaleString() + '</td>' +
            '<td class="rate-good">' + x.success.toLocaleString() + '</td>' +
            '<td style="color:#e74c3c;">' + x.failed.toLocaleString() + '</td>' +
            '<td class="rate-good">' + pct(x.success_rate) + '</td>' +
            '<td style="color:#e74c3c;">' + pct(x.abnormal_rate) + '</td>' +
            '<td>' + x.erfang + '</td>' +
            '<td class="' + chgCls + '">' + chgStr + '</td>' +
            '</tr>';
    }
    var avgAbnormal = 0;
    for (var mi = 0; mi < MON.length; mi++) {
        avgAbnormal += d[MON[mi]].abnormal_rate;
    }
    avgAbnormal = avgAbnormal / 5;
    html += '<tr class="sum-row">' +
        '<td style="text-align:left;padding-left:18px;">1-5月合计</td>' +
        '<td>' + total.t.toLocaleString() + '</td>' +
        '<td class="rate-good">' + total.ok.toLocaleString() + '</td>' +
        '<td style="color:#e74c3c;">' + total.fail.toLocaleString() + '</td>' +
        '<td class="rate-good">' + pct(total.ok/total.t*100) + '</td>' +
        '<td style="color:#e74c3c;">' + pct(total.fail/total.t*100) + '</td>' +
        '<td colspan="2" style="font-size:12px;color:#888;">月均异常率 ' + pct(avgAbnormal) + '</td>' +
        '</tr></tbody></table>';
    document.getElementById('bossSummaryTable').innerHTML = html;
}

// ========== OVERVIEW ==========
var oC1 = null;
var oC2 = null;

function renderOverview() {
    var d5 = D.monthly['5月'];
    var d4 = D.monthly['4月'];
    var kpiHtml =
        '<div class="kpi-card success"><div class="kpi-value">' + pct(d5.success_rate) + '</div><div class="kpi-label">5月完成率</div><div class="kpi-trend ' + (d5.success_rate > d4.success_rate ? 'up' : 'down') + '">' + (d5.success_rate > d4.success_rate ? '↑' : '↓') + Math.abs(d5.success_rate - d4.success_rate).toFixed(1) + '% vs 上月</div></div>' +
        '<div class="kpi-card danger"><div class="kpi-value">' + d5.failed + '</div><div class="kpi-label">5月异常数</div><div class="kpi-trend ' + (d5.failed > d4.failed ? 'up' : 'down') + '">' + (d5.failed > d4.failed ? '↑' : '↓') + Math.abs(d5.failed - d4.failed) + ' vs 上月</div></div>' +
        '<div class="kpi-card warning"><div class="kpi-value">2月</div><div class="kpi-label">异常最高月</div><div class="kpi-trend up">' + pct(D.monthly['2月'].abnormal_rate) + '</div></div>' +
        '<div class="kpi-card ' + (D.error_types['5月_total'] > D.error_types['4月_total'] ? 'danger' : 'success') + '"><div class="kpi-value">' + D.error_types['5月_total'] + '件</div><div class="kpi-label">5月错误</div><div class="kpi-trend ' + (D.error_types['5月_total'] > D.error_types['4月_total'] ? 'up' : 'down') + '">' + (D.error_types['5月_total'] > D.error_types['4月_total'] ? '↑' : '↓') + Math.abs(D.error_types['5月_total'] - D.error_types['4月_total']) + ' vs 上月</div></div>';
    document.getElementById('kpiCards').innerHTML = kpiHtml;

    // Trend chart
    if (oC1) { oC1.destroy(); }
    oC1 = new Chart(document.getElementById('ovTrendChart'), {
        type: 'line',
        data: {
            labels: MON,
            datasets: [
                {
                    label: '完成率 %',
                    data: MON.map(function(m) { return D.monthly[m].success_rate; }),
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39,174,96,0.08)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 8,
                    pointHoverRadius: 10
                },
                {
                    label: '异常率 %',
                    data: MON.map(function(m) { return D.monthly[m].abnormal_rate; }),
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231,76,60,0.08)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 8,
                    pointHoverRadius: 10
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                datalabels: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(1) + '%';
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    ticks: { callback: function(v) { return v + '%'; } }
                }
            }
        }
    });

    var sel = document.getElementById('ovRegionMonth').value;
    if (oC2) { oC2.destroy(); }
    if (sel === 'all') {
        var datasets = [];
        for (var ri = 0; ri < REG.length; ri++) {
            var r = REG[ri];
            datasets.push({
                label: r,
                data: MON.map(function(m) {
                    var x = D.regions[m].find(function(a) { return a.name === r; });
                    return x ? x.success_rate : 0;
                }),
                borderColor: COL[r],
                backgroundColor: COL[r] + '22',
                fill: true,
                tension: 0.3,
                pointRadius: 5
            });
        }
        oC2 = new Chart(document.getElementById('ovRegionChart'), {
            type: 'line',
            data: { labels: MON, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    datalabels: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(1) + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 78,
                        max: 96,
                        ticks: { callback: function(v) { return v + '%'; } }
                    }
                }
            }
        });
    } else {
        var barData = [];
        for (var ri = 0; ri < REG.length; ri++) {
            var r = REG[ri];
            var x = D.regions[sel].find(function(a) { return a.name === r; });
            barData.push(x ? x.success_rate : 0);
        }
        oC2 = new Chart(document.getElementById('ovRegionChart'), {
            type: 'bar',
            data: {
                labels: REG,
                datasets: [{
                    label: '完成率',
                    data: barData,
                    backgroundColor: REG.map(function(r) { return COL[r]; }),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    datalabels: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ctx.parsed.y.toFixed(1) + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 70,
                        max: 100,
                        ticks: { callback: function(v) { return v + '%'; } }
                    }
                }
            }
        });
    }
    document.getElementById('ovRegionMonth').onchange = function() { renderOverview(); };
    document.getElementById('overviewInsight').innerHTML =
        '<strong>📌 核心发现：</strong><br>' +
        '• 1-5月累计拜访<strong>' + MON.reduce(function(s,m) { return s + D.monthly[m].total; }, 0).toLocaleString() + '</strong>店次，总完成率<strong>' + pct(MON.reduce(function(s,m) { return s + D.monthly[m].success; }, 0) / MON.reduce(function(s,m) { return s + D.monthly[m].total; }, 0) * 100) + '</strong><br>' +
        '• 2月因春节假期影响，异常率攀升至<strong>14.3%</strong>（月均10.9%），属可预期的季节性波动<br>' +
        '• 3-5月已恢复正常水平，完成率稳定在89.4%-90.4%区间<br>' +
        '• 上饶大区各月完成率均为最低（平均87%），异常率最高（12%-17%），需重点跟进<br>' +
        '• 5月抽检错误745次，较1月的215次增长246%——部分源于抽检力度加大，但"违规检查/违规操作"117次为新增突出问题';
}

// ========== COMPLETION ==========
var cC1 = null, cC2 = null, cC3 = null;

function renderCompletion() {
    if (cC1) { cC1.destroy(); }
    cC1 = new Chart(document.getElementById('compRateChart'), {
        type: 'bar',
        data: {
            labels: MON,
            datasets: [
                {
                    label: '完成率',
                    data: MON.map(function(m) { return D.monthly[m].success_rate; }),
                    backgroundColor: 'rgba(39,174,96,0.75)',
                    borderRadius: 4
                },
                {
                    label: '异常率',
                    data: MON.map(function(m) { return D.monthly[m].abnormal_rate; }),
                    backgroundColor: 'rgba(231,76,60,0.75)',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    anchor: 'center',
                    align: 'center',
                    font: { size: 10, weight: 'bold' },
                    color: '#fff',
                    formatter: function(v, ctx) {
                        if (ctx.datasetIndex === 0) {
                            return '完成 ' + v.toFixed(1) + '%';
                        } else {
                            return '异常 ' + v.toFixed(1) + '%';
                        }
                    },
                    display: function(ctx) {
                        return ctx.dataset.data[ctx.dataIndex] > 5;
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(1) + '%';
                        }
                    }
                }
            },
            scales: {
                y: { stacked: true, max: 100, ticks: { callback: function(v) { return v + '%'; } } },
                x: { stacked: true }
            }
        }
    });

    if (cC2) { cC2.destroy(); }
    cC2 = new Chart(document.getElementById('compVolChart'), {
        type: 'bar',
        data: {
            labels: MON,
            datasets: [
                {
                    label: '完成',
                    data: MON.map(function(m) { return D.monthly[m].success; }),
                    backgroundColor: '#27ae60',
                    borderRadius: 4
                },
                {
                    label: '异常(失败)',
                    data: MON.map(function(m) { return D.monthly[m].failed; }),
                    backgroundColor: '#e74c3c',
                    borderRadius: 4
                },
                {
                    label: '二访无效',
                    data: MON.map(function(m) { return D.monthly[m].erfang; }),
                    backgroundColor: '#95a5a6',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    anchor: 'center',
                    align: 'center',
                    font: { size: 9, weight: 'bold' },
                    color: function(ctx) {
                        return ctx.datasetIndex === 2 ? '#333' : '#fff';
                    },
                    formatter: function(v, ctx) {
                        if (ctx.datasetIndex === 0) { return v.toLocaleString(); }
                        if (ctx.datasetIndex === 1) { return v.toLocaleString(); }
                        return '';
                    },
                    display: function(ctx) {
                        return ctx.datasetIndex < 2 && ctx.dataset.data[ctx.dataIndex] > 100;
                    }
                },
                legend: { position: 'top' }
            },
            scales: {
                y: { stacked: true },
                x: { stacked: true }
            }
        }
    });

    if (cC3) { cC3.destroy(); }
    var dsComp = [];
    for (var ri = 0; ri < REG.length; ri++) {
        var r = REG[ri];
        dsComp.push({
            label: r,
            data: MON.map(function(m) {
                var x = D.regions[m].find(function(a) { return a.name === r; });
                return x ? x.success_rate : 0;
            }),
            borderColor: COL[r],
            backgroundColor: COL[r] + '22',
            fill: true,
            tension: 0.3,
            pointRadius: 6,
            pointHoverRadius: 8
        });
    }
    cC3 = new Chart(document.getElementById('compRegionChart'), {
        type: 'line',
        data: { labels: MON, datasets: dsComp },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(1) + '%';
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 78,
                    max: 96,
                    ticks: { callback: function(v) { return v + '%'; } }
                }
            }
        }
    });

    // Person table setup
    var sd = document.getElementById('personMonthSelector');
    if (!sd.querySelector('.month-btn')) {
        var btns = ['all','1月','2月','3月','4月','5月'];
        var h = '';
        for (var bi = 0; bi < btns.length; bi++) {
            h += '<button class="month-btn' + (btns[bi] === '5月' ? ' active' : '') + '" data-month="' + btns[bi] + '">' + (btns[bi] === 'all' ? '全部' : btns[bi]) + '</button>';
        }
        sd.innerHTML = h;
        sd.querySelectorAll('.month-btn').forEach(function(b) {
            b.addEventListener('click', function() {
                sd.querySelectorAll('.month-btn').forEach(function(x) { x.classList.remove('active'); });
                this.classList.add('active');
                renderPersonTable();
            });
        });
    }
    document.getElementById('personSort').onchange = function() { renderPersonTable(); };
    renderPersonTable();
}

function renderPersonTable() {
    var sm = '5月';
    var activeBtn = document.querySelector('#personMonthSelector .month-btn.active');
    if (activeBtn) { sm = activeBtn.dataset.month; }
    var sort = document.getElementById('personSort').value;
    var pp;

    if (sm === 'all') {
        var agg = {};
        for (var mi = 0; mi < MON.length; mi++) {
            var m = MON[mi];
            var plist = D.person_monthly[m];
            for (var pi = 0; pi < plist.length; pi++) {
                var p = plist[pi];
                if (!agg[p.name]) {
                    agg[p.name] = { name: p.name, region: p.region, total: 0, success: 0, failed: 0, abnormal: 0, total_errors: 0 };
                }
                agg[p.name].total += p.total;
                agg[p.name].success += p.success;
                agg[p.name].failed += p.failed;
                agg[p.name].abnormal += p.abnormal;
            }
        }
        for (var mi = 0; mi < MON.length; mi++) {
            var elist = D.person_errors[MON[mi]];
            if (elist) {
                for (var ei = 0; ei < elist.length; ei++) {
                    var e = elist[ei];
                    if (agg[e.name]) {
                        agg[e.name].total_errors = (agg[e.name].total_errors || 0) + e.total_errors;
                    }
                }
            }
        }
        pp = Object.values(agg);
        for (var pi = 0; pi < pp.length; pi++) {
            pp[pi].success_rate = pp[pi].total ? pp[pi].success / pp[pi].total * 100 : 0;
            pp[pi].abnormal_rate = pp[pi].total ? pp[pi].abnormal / pp[pi].total * 100 : 0;
        }
    } else {
        pp = JSON.parse(JSON.stringify(D.person_monthly[sm]));
        var errMap = {};
        var elist = D.person_errors[sm] || [];
        for (var ei = 0; ei < elist.length; ei++) {
            errMap[elist[ei].name] = elist[ei].total_errors;
        }
        for (var pi = 0; pi < pp.length; pi++) {
            pp[pi].total_errors = errMap[pp[pi].name] || 0;
        }
    }

    pp.sort(function(a, b) {
        var av = a[sort] || 0;
        var bv = b[sort] || 0;
        return bv - av;
    });

    var tbody = document.querySelector('#personTable tbody');
    var html = '';
    for (var pi = 0; pi < pp.length; pi++) {
        var p = pp[pi];
        var failedStyle = p.failed > 50 ? '#e74c3c' : '#555';
        var abRate = p.abnormal_rate;
        var abStyle = abRate > 15 ? '#e74c3c' : (abRate > 10 ? '#f39c12' : '#555');
        var errCls = '';
        if (p.total_errors >= 30) { errCls = 'err-high'; }
        else if (p.total_errors >= 15) { errCls = 'err-mid'; }
        html += '<tr>' +
            '<td>' + (pi + 1) + '</td>' +
            '<td><strong>' + p.name + '</strong></td>' +
            '<td>' + p.region + '</td>' +
            '<td>' + p.total + '</td>' +
            '<td>' + p.success + '</td>' +
            '<td style="color:' + failedStyle + '">' + p.failed + '</td>' +
            '<td class="' + rc(p.success_rate) + '">' + pct(p.success_rate) + '</td>' +
            '<td style="color:' + abStyle + '">' + pct(p.abnormal_rate) + '</td>' +
            '<td class="' + errCls + '">' + (p.total_errors || 0) + '</td>' +
            '</tr>';
    }
    tbody.innerHTML = html;
}

// ========== ABNORMAL ==========
var aC1 = null, aC2 = null;

function renderAbnormal() {
    if (aC1) { aC1.destroy(); }
    aC1 = new Chart(document.getElementById('abTrendChart'), {
        type: 'line',
        data: {
            labels: MON,
            datasets: [{
                label: '异常率 %',
                data: MON.map(function(m) { return D.monthly[m].abnormal_rate; }),
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231,76,60,0.08)',
                fill: true,
                tension: 0.3,
                pointRadius: 8,
                pointHoverRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { datalabels: { display: false } },
            scales: {
                y: {
                    min: 0,
                    max: 20,
                    ticks: { callback: function(v) { return v + '%'; } }
                }
            }
        }
    });

    if (aC2) { aC2.destroy(); }
    var aDs = [];
    for (var ri = 0; ri < REG.length; ri++) {
        var r = REG[ri];
        aDs.push({
            label: r,
            data: MON.map(function(m) {
                var x = D.regions[m].find(function(a) { return a.name === r; });
                return x ? x.abnormal_rate : 0;
            }),
            borderColor: COL[r],
            backgroundColor: COL[r] + '22',
            fill: true,
            tension: 0.3,
            pointRadius: 5
        });
    }
    aC2 = new Chart(document.getElementById('abRegionChart'), {
        type: 'line',
        data: { labels: MON, datasets: aDs },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { datalabels: { display: false } },
            scales: {
                y: {
                    min: 0,
                    max: 20,
                    ticks: { callback: function(v) { return v + '%'; } }
                }
            }
        }
    });

    renderHeatmap();
    document.getElementById('abnormalInsight').innerHTML =
        '<strong>⚠️ 异常情况总结：</strong><br>' +
        '• 头号异常原因"锁门/临时关门"月均约1,200例——2月春节前后为峰值（占当月异常量的70%+）<br>' +
        '• "倒闭/停业"逐月上升（1月197例→5月341例），累计约1,300例，反映门店加速汰换，数据库更新需同步<br>' +
        '• "特殊场所无法进入"4月异常升高至344例，可能与季度覆盖范围调整有关，建议与客户确认是否应纳入排除清单<br>' +
        '• 上饶大区异常率各区最高（5月14.1%），赣州最低（7.5%），区域管理存在明显差异';
}

function renderHeatmap() {
    var allR = {};
    for (var mi = 0; mi < MON.length; mi++) {
        var reasons = D.abnormal_reasons[MON[mi]];
        for (var ri = 0; ri < reasons.length; ri++) {
            var a = reasons[ri];
            allR[a.reason] = (allR[a.reason] || 0) + a.count;
        }
    }
    var sorted = Object.entries(allR).sort(function(a, b) { return b[1] - a[1]; });
    var top8 = [];
    for (var si = 0; si < sorted.length && top8.length < 8; si++) {
        if (sorted[si][0] !== 'NA' && sorted[si][0] !== '#N/A') {
            top8.push(sorted[si][0]);
        }
    }

    var fixPlan = {
        '锁门/临时关门': '到店未开门→检查员先打电话确认；城区门店可安排二访（当日或改天再跑一趟），乡镇门店路远成本高只能放弃；按规定拜访时间7:30-20:30，餐饮店尽量中午10:30-13:30或下午16:30后去',
        '倒闭/停业': '检查员在系统上标记"倒闭/停业"，督导确认后更新数据库；理想情况实时跟进，实际执行中尽量做到月底前统一处理一批',
        '特殊场所（学校/部队等）无法进入': '必须提供证据（如门口照片、门卫告知记录等），有证据可向客户申请从清单剔除；没有证据按不合格处理',
        '客户拒访，未采集': '先尝试沟通说明品牌检查目的，仍拒访则上报督导协调；多次拒访的门店由客户经理层面沟通',
        '根据地址找不到客户/拆迁': '出发前用地图App确认大致位置；到地址发现找不到→电话联系门店确认；确认拆迁的系统标记更新',
        '门店装修': '标记"装修中"并设置复查提醒；装修超过60天的评估是否需核销',
        '其他原因（若选此项，需备注具体原因）': '要求检查员必须填写具体备注，督导审核时发现空白备注退回重填',
        '距离太远': '日常规划路线时尽量就近安排；远距离门店集中安排在固定拜访日',
        '季节性不售卖饮料': '标注为非当季门店，待下季度复查',
        '转行或不销售饮料产品': '确认后系统核销门店',
        '进错门店': '出发前核对门店名称和地址，避免跑错'
    };

    var totalAnomalies = 0;
    for (var mi = 0; mi < MON.length; mi++) {
        totalAnomalies += D.monthly[MON[mi]].abnormal;
    }

    var html = '<table class="heatmap-table"><thead><tr>' +
        '<th>异常原因</th><th>累计</th><th>占比</th>';
    for (var mi = 0; mi < MON.length; mi++) {
        html += '<th>' + MON[mi] + '</th>';
    }
    html += '<th>趋势</th><th style="min-width:180px;">整改计划</th></tr></thead><tbody>';

    for (var ti = 0; ti < top8.length; ti++) {
        var reason = top8[ti];
        var counts = [];
        var totalCnt = 0;
        var maxV = 0;
        for (var mi = 0; mi < MON.length; mi++) {
            var x = D.abnormal_reasons[MON[mi]].find(function(a) { return a.reason === reason; });
            var cnt = x ? x.count : 0;
            counts.push(cnt);
            totalCnt += cnt;
            if (cnt > maxV) { maxV = cnt; }
        }
        if (maxV === 0) { maxV = 1; }
        var pctAll = (totalCnt / totalAnomalies * 100).toFixed(1);

        html += '<tr><td>' + reason + '</td>';
        html += '<td style="font-weight:700;font-size:13px;">' + totalCnt + '</td>';
        html += '<td style="font-size:12px;">' + pctAll + '%</td>';

        for (var ci = 0; ci < counts.length; ci++) {
            var v = counts[ci];
            var p = v / maxV;
            var R = Math.round(255 - p * 200);
            var G = Math.round(240 - p * 200);
            var B = Math.round(240 - p * 180);
            var fg = p > 0.5 ? '#fff' : '#333';
            var fw = p > 0.3 ? '600' : '400';
            var monthTotal = D.monthly[MON[ci]].abnormal;
            var pctM = monthTotal ? (v / monthTotal * 100).toFixed(1) : '0.0';
            html += '<td class="val-cell" style="background:rgb(' + R + ',' + G + ',' + B + ');color:' + fg + ';font-weight:' + fw + '" title="' + reason + ' | ' + MON[ci] + ': ' + v + '次 / 占当月异常 ' + pctM + '%">' + v + '</td>';
        }

        var trendStr = '';
        for (var ci = 1; ci < counts.length; ci++) {
            if (counts[ci] > counts[ci-1]) { trendStr += '↑ '; }
            else if (counts[ci] < counts[ci-1]) { trendStr += '↓ '; }
            else { trendStr += '→ '; }
        }
        html += '<td style="font-size:11px;">' + trendStr + '</td>';

        var plan = fixPlan[reason] || '检查核实后根据实际情况处理';
        html += '<td class="fix-col">' + plan + '</td></tr>';
    }
    html += '</tbody></table>';
    document.getElementById('abnormalHeatmapWrap').innerHTML = html;
}

// ========== PERSON ABNORMAL ==========
function renderPa() {
    var sd = document.getElementById('paMonthSelector');
    if (!sd.querySelector('.month-btn')) {
        var h = '';
        for (var mi = 0; mi < MON.length; mi++) {
            h += '<button class="month-btn' + (MON[mi] === '5月' ? ' active' : '') + '" data-month="' + MON[mi] + '">' + MON[mi] + '</button>';
        }
        sd.innerHTML = h;
        sd.querySelectorAll('.month-btn').forEach(function(b) {
            b.addEventListener('click', function() {
                sd.querySelectorAll('.month-btn').forEach(function(x) { x.classList.remove('active'); });
                this.classList.add('active');
                renderPa();
            });
        });
    }
    document.getElementById('paSort').onchange = function() { renderPa(); };
    document.getElementById('paRegion').onchange = function() { renderPa(); };

    var sm = sd.querySelector('.month-btn.active');
    sm = sm ? sm.dataset.month : '5月';
    var sort = document.getElementById('paSort').value;
    var region = document.getElementById('paRegion').value;

    var pp = D.person_monthly[sm] || [];
    if (region !== 'all') {
        pp = pp.filter(function(p) { return p.region === region; });
    }
    pp = pp.filter(function(p) { return p.abnormal > 0; });
    pp.sort(function(a, b) {
        if (sort === 'name') { return a.name.localeCompare(b.name); }
        return b.abnormal - a.abnormal;
    });

    var errMap = {};
    var elist = D.person_errors[sm] || [];
    for (var ei = 0; ei < elist.length; ei++) {
        errMap[elist[ei].name] = elist[ei].total_errors;
    }

    var container = document.getElementById('personAbnormalCards');
    if (pp.length === 0) {
        container.innerHTML = '<div class="card" style="grid-column:1/-1;text-align:center;color:#999;padding:40px;">该月无异常数据</div>';
    } else {
        var html = '';
        for (var pi = 0; pi < pp.length; pi++) {
            var p = pp[pi];
            var errCnt = errMap[p.name] || 0;
            var abRate = p.total ? p.abnormal / p.total * 100 : 0;
            var action = '';

            if (abRate >= 25 || p.failed >= 40) {
                action = '<div class="pc-action" style="background:#ffeaea;color:#c0392b;">' +
                    '<strong>🔴 立即处理：</strong>建议本周内约谈' + p.name + '。<br>' +
                    '· 约谈内容：逐单复盘' + p.failed + '次失败的原因分布，重点分析是门店问题（如倒闭/锁门）还是执行问题（如沟通技巧、路线规划）<br>' +
                    '· 处理方案：若为执行问题→安排资深督导带教1天现场指导；若为门店问题→协助优化拜访路线<br>' +
                    '· 复查要求：约谈后下周每日提交至下班前总结，确认改进情况<br>' +
                    '· 升级机制：若连续2周无改善，上报区域主管介入</div>';
            } else if (abRate >= 15 || p.failed >= 20) {
                action = '<div class="pc-action" style="background:#fff8e1;color:#8a6d00;">' +
                    '<strong>🟠 需关注：</strong>建议本周与' + p.name + '进行一次简短沟通。<br>' +
                    '· 沟通内容：了解' + p.failed + '次失败的具体原因，询问是否存在困难<br>' +
                    '· 处理方案：针对其高频异常原因（如"锁门/临时关门"占比高→调整拜访时间；"客户拒访"占比高→提供沟通话术培训）<br>' +
                    '· 复查要求：2周后复查异常率，若未改善升级为正式约谈</div>';
            } else if (abRate >= 10 || p.failed >= 10) {
                action = '<div class="pc-action" style="background:#e8f8e8;color:#1a6b1a;">' +
                    '<strong>🟡 常规跟进：</strong>日常管理中留意' + p.name + '的异常情况。<br>' +
                    '· 建议：晨会时提醒其关注高频异常原因<br>' +
                    '· 复查要求：月底核对异常率，如无明显恶化则保持观察</div>';
            } else {
                action = '<div class="pc-action" style="background:#eef2ff;color:#2c3e50;">' +
                    '<strong>🟢 表现正常：</strong>' + p.name + '异常率' + pct(abRate) + '，低于团队平均水平，继续保持。<br>' +
                    '· 建议：分享其经验给团队其他成员作为正面案例</div>';
            }

            html += '<div class="person-card">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                '<div><span class="pc-name">' + p.name + '</span> <span class="pc-region">' + p.region + '</span></div>' +
                '<div><span class="pc-count" style="color:#e74c3c;">' + p.abnormal + '</span><span style="font-size:12px;color:#999;"> / ' + p.total + '</span></div>' +
                '</div>' +
                '<div style="display:flex;gap:12px;margin:6px 0;font-size:12px;color:#555;">' +
                '<span>异常率 <strong style="color:' + (abRate >= 15 ? '#e74c3c' : (abRate >= 10 ? '#f39c12' : '#27ae60')) + '">' + pct(abRate) + '</strong></span>' +
                '<span>完成 <strong class="rate-good">' + p.success + '</strong></span>' +
                '<span>错误 <strong style="color:' + (errCnt >= 20 ? '#e74c3c' : (errCnt >= 10 ? '#f39c12' : '#555')) + '">' + errCnt + '</strong></span>' +
                '</div>' + action + '</div>';
        }
        container.innerHTML = html;
    }

    var totalAb = 0;
    for (var pi = 0; pi < pp.length; pi++) {
        totalAb += pp[pi].abnormal;
    }
    var highR = 0;
    for (var pi = 0; pi < pp.length; pi++) {
        if (pp[pi].total && pp[pi].abnormal / pp[pi].total * 100 >= 20) {
            highR++;
        }
    }
    var top3Str = '';
    for (var pi = 0; pi < Math.min(3, pp.length); pi++) {
        var p = pp[pi];
        var r = p.total ? p.abnormal / p.total * 100 : 0;
        top3Str += p.name + '(' + p.abnormal + '次/异常率' + pct(r) + ')';
        if (pi < Math.min(3, pp.length) - 1) { top3Str += '、'; }
    }
    document.getElementById('personAbnormalInsight').innerHTML =
        '<strong>👤 ' + sm + ' 异常人员汇总：</strong><br>' +
        '• ' + sm + '共<strong>' + pp.length + '</strong>人产生异常（异常总数' + totalAb + '次），其中高异常率（≥20%）<strong>' + highR + '</strong>人<br>' +
        '• 异常数最多3人：' + top3Str + '<br>' +
        '• 请各区域主管按上述处理方案逐一跟进，2周后复查改善情况';
}

// ========== PERSON ERRORS ==========
function renderPe() {
    var sd = document.getElementById('errPersonMonthSelector');
    if (!sd.querySelector('.month-btn')) {
        var btns = ['all','1月','2月','3月','4月','5月'];
        var h = '';
        for (var bi = 0; bi < btns.length; bi++) {
            h += '<button class="month-btn' + (btns[bi] === '5月' ? ' active' : '') + '" data-month="' + btns[bi] + '">' + (btns[bi] === 'all' ? '全部' : btns[bi]) + '</button>';
        }
        sd.innerHTML = h;
        sd.querySelectorAll('.month-btn').forEach(function(b) {
            b.addEventListener('click', function() {
                sd.querySelectorAll('.month-btn').forEach(function(x) { x.classList.remove('active'); });
                this.classList.add('active');
                renderPe();
            });
        });
    }
    document.getElementById('errPersonSort').onchange = function() { renderPe(); };
    document.getElementById('errPersonRegion').onchange = function() { renderPe(); };

    var sm = sd.querySelector('.month-btn.active');
    sm = sm ? sm.dataset.month : '5月';
    var sort = document.getElementById('errPersonSort').value;
    var region = document.getElementById('errPersonRegion').value;

    var pp;
    if (sm === 'all') {
        var agg = {};
        for (var mi = 0; mi < MON.length; mi++) {
            var plist = D.person_errors[MON[mi]] || [];
            for (var pi = 0; pi < plist.length; pi++) {
                var p = plist[pi];
                if (!agg[p.name]) {
                    agg[p.name] = { name: p.name, region: p.region, total_errors: 0, top_errors: [] };
                }
                agg[p.name].total_errors += p.total_errors;
                for (var ei = 0; ei < p.top_errors.length; ei++) {
                    var e = p.top_errors[ei];
                    var ex = agg[p.name].top_errors.find(function(x) { return x.error === e.error; });
                    if (ex) { ex.count += e.count; }
                    else { agg[p.name].top_errors.push({ error: e.error, count: e.count }); }
                }
            }
        }
        Object.values(agg).forEach(function(p) {
            p.top_errors.sort(function(a, b) { return b.count - a.count; });
        });
        pp = Object.values(agg);
    } else {
        pp = D.person_errors[sm] || [];
    }

    if (region !== 'all') {
        pp = pp.filter(function(p) { return p.region === region; });
    }
    pp.sort(function(a, b) {
        if (sort === 'name') { return a.name.localeCompare(b.name); }
        return b.total_errors - a.total_errors;
    });

    var container = document.getElementById('personErrorCards');
    if (pp.length === 0) {
        container.innerHTML = '<div class="card" style="grid-column:1/-1;text-align:center;color:#999;padding:40px;">暂无数据</div>';
    } else {
        var html = '';
        var maxShow = Math.min(40, pp.length);
        for (var pi = 0; pi < maxShow; pi++) {
            var p = pp[pi];
            var top4 = p.top_errors.slice(0, 4);
            var cls = p.total_errors >= 30 ? 'err-high' : (p.total_errors >= 15 ? 'err-mid' : '');
            var barW = Math.min(100, p.total_errors / 3);
            var barColor = p.total_errors >= 30 ? '#e74c3c' : (p.total_errors >= 15 ? '#f39c12' : '#27ae60');

            var topHtml = '';
            for (var ei = 0; ei < top4.length; ei++) {
                var e = top4[ei];
                var eLabel = e.error.length > 20 ? e.error.slice(0, 20) + '…' : e.error;
                topHtml += '<span class="pc-item">' + e.count + '× ' + eLabel + '</span>';
            }

            var detailHtml = '';
            for (var ei = 0; ei < p.top_errors.length; ei++) {
                detailHtml += '<span class="pc-item">' + p.top_errors[ei].count + '× ' + p.top_errors[ei].error + '</span>';
            }

            html += '<div class="person-card">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                '<div><span class="pc-name">' + p.name + '</span><span class="pc-region">' + p.region + '</span></div>' +
                '<div class="pc-count ' + cls + '">' + p.total_errors + '</div></div>' +
                '<div style="display:flex;align-items:center;gap:6px;margin:4px 0;">' +
                '<span style="font-size:11px;color:#999;">错误次数</span>' +
                '<div style="flex:1;height:6px;background:#f0f0f0;border-radius:3px;overflow:hidden;">' +
                '<div style="height:100%;width:' + barW + '%;background:' + barColor + ';border-radius:3px;"></div></div></div>' +
                '<div class="pc-list">' + topHtml + '</div>' +
                '<details style="margin-top:6px;"><summary style="font-size:11px;color:#888;cursor:pointer;">查看全部' + p.top_errors.length + '种错误</summary>' +
                '<div class="pc-list" style="margin-top:4px;">' + detailHtml + '</div></details></div>';
        }
        container.innerHTML = html;
    }

    document.getElementById('errorInsight').innerHTML =
        '<strong>❌ 错误情况汇总：</strong><br>' +
        '• 5月错误最多：邓义涛(89次)、伍洋(80次)、李翔(69次)、马里金(58次)——此4人合计296次，占当月40%<br>' +
        '• 3月张晓亮-外包单月199次（占当月53%），已超出正常范围，需核查是否工作态度问题<br>' +
        '• 5月新出现"违规检查/违规操作"117次——以马里金(31次)、邓义涛(27次)为主，需排查是否为系统性问题或个别人员违规<br>' +
        '• 注：抽检样本量从1月265次增长至5月745次（+181%），错误绝对数增长部分来源于此';
}

// ========== RECOMMENDATIONS ==========
function renderRecs() {
    var recs = [
        { t: '紧急', tc: 'urgent', tt: '上饶大区专项帮扶计划',
          bb: '<strong>策略方向：</strong>上饶大区连续5个月完成率排名末位（5月88.8%），异常率14.1%为全区最高。谢锦云（77.6%）、章顺锋（80.3%）需重点跟進。短期内通过现场带教+路线优化快速止血，中期建立日常复盘机制持续改善。<br><br>' +
              '<strong>执行落地：</strong><br>' +
              '1. 人员带教：安排资深督导到上饶驻点1-2周，对谢锦云、章顺锋跟访带教（每日跟5-8店，现场纠偏报备流程和拍摄标准）<br>' +
              '2. 按时段规划路线：拜访时间窗口为7:30-20:30。餐饮店集中安排在中午10:30-13:30或下午16:30以后；便利店/超市正常时段即可。"锁门"历史记录多的门店到店未开先打电话确认，城区可二访、乡镇放弃<br>' +
              '3. 每日复盘：区域主管每日收集失败门店清单，分析原因（是锁门/倒闭还是执行问题），次日调整路线<br>' +
              '4. 每周追踪：周报汇总逐人完成率变化，连续3周无改善升级处理' },
        { t: '紧急', tc: 'urgent', tt: '违规检查/违规操作专项整改',
          bb: '<strong>策略方向：</strong>5月新出现的"违规检查/违规操作"117次（马里金31次、邓义涛27次、朱梃树18次），占当月错误15.7%。此问题5月首次出现，必须立即遏止，否则将影响客户信任。<br><br>' +
              '<strong>执行落地：</strong><br>' +
              '1. 核实取证：调取马里金、邓义涛、朱梃树的5月全部检查记录，逐单核查拍摄照片和填写记录，确认违规性质和程度<br>' +
              '2. 通报+定规矩：群内通报案例（不点名），明确违规定义和处罚——首次警告、二次罚款、三次停岗培训<br>' +
              '3. SOP一页纸：把标准操作流程缩短为一页纸+手机速查版，全员过一遍考试（80分及格）<br>' +
              '4. 约谈当事人：逐单指出问题，签整改承诺书；6月再违规的停岗3天重新培训' },
        { t: '重要', tc: 'medium', tt: '高风险检查员定向处理',
          bb: '<strong>策略方向：</strong>个别人员长期高错误/低完成率——伍洋（72.4%·80次错）、邓义涛（89次错·27次违规）、张晓亮-外包（3月199次）。不能全盘否定，但必须有明确的改进要求和时限。<br><br>' +
              '<strong>执行落地：</strong><br>' +
              '1. 伍洋：分析80次错误分布（套餐填写12次、照片拍反8次、铺货点错6次），安排邓敦福跟访3天带教；要求6月完成率≥85%、错误≤40次<br>' +
              '2. 邓义涛：27次违规操作重点排查原因（赶时间/偷懒/不懂标准），停岗1天重新培训考核后恢复<br>' +
              '3. 张晓亮-外包：核实4-5月数据，如仍未改善则考虑更换' },
        { t: '重要', tc: 'medium', tt: '协议填写准确性专项提升',
          bb: '<strong>策略方向：</strong>"TOP协议填错""协议错误"贯穿1-5月，直接影响客户数据质量。属于培训+督导检查可以解决的问题。<br><br>' +
              '<strong>执行落地：</strong><br>' +
              '1. 把常见协议的填写步骤截图做成速查卡（存手机里随时看）<br>' +
              '2. 新人入职：模拟环境填5份协议，全对才能上线<br>' +
              '3. 新人前两周：督导每天审协议部分，发现错误电话纠正<br>' +
              '4. 每月统计每人协议错误次数，公示排名' },
        { t: '一般', tc: 'normal', tt: '门店数据库维护',
          bb: '<strong>策略方向：</strong>"倒闭/停业"从1月197例增至5月341例，无效门店拖累完成率。系统上可以做更新，但执行层面不一定能实时跟进，尽力做到月度集中清理。<br><br>' +
              '<strong>执行落地：</strong><br>' +
              '1. 检查员发现倒闭/停业→系统标记，督导确认后更新（尽量及时，不保证实时）<br>' +
              '2. 月底集中批量处理当月异常门店数据<br>' +
              '3. 连续2次标记复查，3次标记考虑核销' },
        { t: '一般', tc: 'normal', tt: '2027年春节预案（提前规划）',
          bb: '<strong>策略方向：</strong>2月春节异常率14.3%（月均10.9%），"锁门/临时关门"占71%。属于每年可预见的周期性波动，提前规划可以减轻影响。<br><br>' +
              '<strong>执行落地：</strong><br>' +
              '1. 明年1月参考今年数据预估2月预算，建议总量下调10-15%<br>' +
              '2. 春节前2周加大拜访（压缩到3周跑完4周的量）<br>' +
              '3. 2月KPI适当调低（完成率目标从90%→82%），避免检查员因压力违规<br>' +
              '4. 弹性排班安排春节前后补访' },
        { t: '一般', tc: 'normal', tt: '检查员梯队建设与绩效管理',
          bb: '<strong>策略方向：</strong>团队分化明显——徐佩琦98.6% vs 伍洋72.4%，22%的人员月拜访量低于600店。需要建立"以强带弱"的机制和公平透明的排名。<br><br>' +
              '<strong>执行落地：</strong><br>' +
              '1. 导师制：高绩效的（徐佩琦、钟鑫武、邓敦福）和低绩效的结对，导师跟访带教计入绩效加分<br>' +
              '2. 每月公示排行榜（Top 10 + 末位5人），三个维度看：完成率、异常率、错误数<br>' +
              '3. 连续末位的由主管约谈，分析原因定改进计划<br>' +
              '4. 季度激励：第一名500、第二名300、第三名200；进步最快奖300' },
    ];

    var html = '';
    for (var ri = 0; ri < recs.length; ri++) {
        var r = recs[ri];
        var bColor = r.tc === 'urgent' ? '#e74c3c' : (r.tc === 'medium' ? '#f39c12' : '#27ae60');
        var bgColor = r.tc === 'urgent' ? '#ffeaea' : (r.tc === 'medium' ? '#fff8e1' : '#e8f8e8');
        var tColor = r.tc === 'urgent' ? '#e74c3c' : (r.tc === 'medium' ? '#f39c12' : '#27ae60');
        html += '<div class="card" style="border-left:4px solid ' + bColor + ';">' +
            '<h3><span style="display:inline-block;padding:2px 10px;border-radius:4px;font-size:11px;margin-right:8px;background:' + bgColor + ';color:' + tColor + ';">' + r.t + '</span> ' + r.tt + '</h3>' +
            '<div style="font-size:13px;color:#444;line-height:1.8;">' + r.bb + '</div></div>';
    }
    document.getElementById('recommendations').innerHTML = html;
}

// ========== NAV ==========
document.querySelectorAll('.nav a').forEach(function(a) {
    a.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav a').forEach(function(x) { x.classList.remove('active'); });
        this.classList.add('active');
        document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
        document.getElementById('section-' + this.dataset.section).classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

window.addEventListener('scroll', function() {
    var btn = document.getElementById('scrollTop');
    if (window.scrollY > 300) { btn.style.display = 'block'; }
    else { btn.style.display = 'none'; }
});

load();
