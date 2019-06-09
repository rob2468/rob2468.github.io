window.onload = function () {
  init();
};

function init() {
  // 初始化 LeanCloud 的服务
  initLeadCloud();

  // 从 LeanCloud 查询数据
  const now = new Date(); // 从当天开始，向前请求若干天的数据
  const xAxis = [];
  const yAxis = [];
  const length = 10;  // 横坐标值的数量
  let num = 0;
  buildChart(now, num, length, xAxis, yAxis);
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
