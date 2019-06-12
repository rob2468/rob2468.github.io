const kServerServiceHost = 'vps.jamchenjun.com';

window.onload = function () {
  init();
};

async function init() {
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

    const yAxis = [];

    // 所有查询的日期
    const displayTimeArr = [];
    let timestamp = now; // 初始时间戳
    let i = 0;
    while (i < days) {
      // 计算出所有查询的日期
      const dateStr = getFormattedBeijingDateString(timestamp);
      displayTimeArr.unshift(dateStr);

      // y 轴值
      let yVal = 0;
      const dayData = result[dateStr];
      dayData.forEach(ele => {
        const {
          count = 0,
          pageId = '',
          title = '',
        } = ele;
        yVal += count;
      });
      yAxis.unshift(yVal);

      // 前一天
      timestamp -= 24 * 60 * 60 * 1000;
      i++;
    }

    const xAxis = displayTimeArr;
    renderChart(xAxis, yAxis);
  }



  // const now = new Date(); // 从当天开始，向前请求若干天的数据
  // const xAxis = [];
  // const yAxis = [];
  // const length = 10;  // 横坐标值的数量
  // let num = 0;
  // buildChart(now, num, length, xAxis, yAxis);
}

function buildChart(date, num, length, xAxis, yAxis) {
  if (num >= length) {
    // 达到指定数量，渲染
    renderChart(xAxis, yAxis);
    return;
  }

  // 请求数据
  requestData(date, (result) => {
    const dateString = getFormattedDateString(date);
    xAxis.unshift(dateString);

    if (result.success) {
      yAxis.unshift(result.data.count);
    } else {
      yAxis.unshift(0);
    }

    const millisecondsADay = 24 * 60 * 60 * 1000;
    date = new Date(date.getTime() - millisecondsADay);
    num++;
    buildChart(date, num, length, xAxis, yAxis);
  });
}

function requestData(date, callback) {
  const dateString = getFormattedDateString(date);
  const cql = `select count(*) from counter where createDate = "${dateString}"`;

  AV.Query.doCloudQuery(cql).then(function (data) {
    callback({
      success: true,
      data,
    });
  }, function (error) {
    callback({
      success: false,
    });
  });
}

function renderChart(xAxis, yAxis) {
 // 基于准备好的dom，初始化echarts实例
  var myChart = echarts.init(document.getElementById('summary'));

  // 指定图表的配置项和数据
  var option = {
    title: {
      text: 'pv总览',
    },
    tooltip: {},
    legend: {
        data: [],
    },
    xAxis: {
        data: xAxis,
    },
    yAxis: {},
    series: [{
      name: '',
      type: 'bar',
      data: yAxis,
    }, {
      name:'',
      type:'line',
      data: yAxis,
    }],
  };

  // 使用刚指定的配置项和数据显示图表。
  myChart.setOption(option);
}
