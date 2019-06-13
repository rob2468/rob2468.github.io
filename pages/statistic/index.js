const kServerServiceHost = 'vps.jamchenjun.com';
let summaryChart; // 总览图 echarts 实例
let dailySectorChart; // 扇形图 echarts 实例

window.onload = function () {
  init();
};

async function init() {
  summaryChart = echarts.init(document.getElementById('summary'));
  summaryChart.showLoading();
  dailySectorChart = echarts.init(document.getElementById('daily-sector'));
  dailySectorChart.showLoading();

  // 查询行为数据
  const now = Date.now();
  const displayTime = getFormattedBeijingDateString(now);
  const days = 10;
  const responseJSON = await getHttpDataPromise({
    url: `https://${kServerServiceHost}:443/api/stat?display_time=${displayTime}&prev_days=${days}`,
  });

  if (responseJSON && responseJSON.success && responseJSON.result) {
    // 结果解析
    const result = responseJSON.result;

    // 显示总览图
    summaryChart.hideLoading();
    renderSummaryChart(now, result);

    // 显示当天的访问比例图
    dailySectorChart.hideLoading();
    renderDailySectorChart(displayTime, result[displayTime]);
  }
}

/**
 * 柱状图
 * @param {number} now timestamp
 * @param {object} sourceData 原始数据
 */
function renderSummaryChart(now, sourceData) {
  // 构造数据
  const xAxis = [];
  const yAxis = [];
  let timestamp = now; // 初始时间戳
  let i = 0;
  const days = Object.keys(sourceData).length;
  while (i < days) {
    // 计算出所有查询的日期
    const dateStr = getFormattedBeijingDateString(timestamp);
    xAxis.unshift(dateStr);

    // y 轴值
    let yVal = 0;
    const dayData = sourceData[dateStr];
    dayData.forEach(ele => {
      const {
        count = 0
      } = ele;
      yVal += count;
    });
    yAxis.unshift(yVal);

    // 前一天
    timestamp -= 24 * 60 * 60 * 1000;
    i++;
  }

  // 指定图表的配置项和数据
  const option = {
    title: {
      text: 'pv总览',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer : {
        type : 'shadow',
      }
    },
    legend: {
      data: [],
    },
    xAxis: {
      data: xAxis,
    },
    yAxis: {},
    series: [{
      name: 'pv',
      type: 'bar',
      data: yAxis,
    }],
  };

  // 使用刚指定的配置项和数据显示图表。
  summaryChart.setOption(option);

  // 响应点击事件
  summaryChart.on('click', param => {
    if (param.name) {
      renderDailySectorChart(param.name, sourceData[param.name]);
    }
  });
}

/**
 * 饼图
 * @param {string} displayTime
 * @param {array} dayData
 */
function renderDailySectorChart(displayTime, dayData) {
  // 构造数据
  const data = dayData.map(currentValue => {
    const {
      count = 0,
      title = '',
    } = currentValue;
    return {
      name: title,
      value: count,
    };
  });

  // 指定图表的配置项和数据
  const option = {
    title : {
      text: `${displayTime}`,
    },
    tooltip : {
      trigger: 'item',
      formatter: "{b} : {c} ({d}%)"
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 10,
      top: 20,
      bottom: 20,
    },
    series : [{
        name: '',
        type: 'pie',
        radius : '80%',
        center: ['50%', '50%'],
        data,
        label: {
          normal: {
            show: false,
          },
          emphasis: {
            show: false,
          }
        },
        itemStyle: {
          emphasis: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          }
        }
      }
    ]
  };

  // 使用刚指定的配置项和数据显示图表。
  dailySectorChart.setOption(option);
}
