<template>
  <v-flex :class="`pa-0 clear-zoom-${Scale.toString().replaceAll('.', '-')}`">
    <VueApexCharts
      class="px-0"
      type="bar"
      height="180"
      width="100%"
      :options="chartOptions"
      :series="series"
    />
  </v-flex>
</template>

<script>
import { mapState } from 'vuex'
import VueApexCharts from 'vue-apexcharts'
import { THEME_COLORS } from '@/utils/chart'

export default {
  name: 'LogBar',
  components: {
    VueApexCharts,
  },
  data: () => ({
    chartData: {
      'xAxis-data': [],
      'yAxis-data': {
        info: [],
        debug: [],
        error: [],
        warn: [],
        unknown: [],
      },
    },
  }),
  computed: {
    ...mapState(['Scale']),
    series() {
      return [
        {
          name: 'Info',
          data: this.chartData['yAxis-data'].info,
        },
        {
          name: 'Debug',
          data: this.chartData['yAxis-data'].debug,
        },
        {
          name: 'Warn',
          data: this.chartData['yAxis-data'].warn,
        },
        {
          name: 'Error',
          data: this.chartData['yAxis-data'].error,
        },
        {
          name: 'Unknown',
          data: this.chartData['yAxis-data'].unknown,
        },
      ]
    },
    chartOptions() {
      return {
        colors: THEME_COLORS,
        chart: {
          toolbar: {
            show: false,
          },
        },
        legend: {
          show: false,
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          curve: 'smooth',
          width: 2,
        },
        xaxis: {
          categories: this.chartData['xAxis-data'],
          labels: {
            style: {
              cssClass: 'grey--text lighten-2--text fill-color',
            },
          },
        },
        yaxis: {},
        grid: {
          show: true,
          borderColor: 'rgba(0, 0, 0, .3)',
          strokeDashArray: 3,
          xaxis: {
            lines: {
              show: true,
            },
          },
          yaxis: {
            lines: {
              show: true,
            },
          },
        },
        tooltip: {
          theme: 'dark',
          y: {
            formatter: function (val) {
              return val
            },
          },
        },
      }
    },
  },
}
</script>
