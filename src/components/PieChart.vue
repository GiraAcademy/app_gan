<template>
  <div class="pie-chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Pie } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    default: () => ({})
  }
})

const chartCanvas = ref(null)
let chart = null

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: {
          size: 10
        },
        padding: 10
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.label || ''
          const value = context.parsed || 0
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
          return `${label}: ${value.toFixed(2)} ha (${percentage}%)`
        }
      }
    }
  }
}

const createChart = () => {
  if (chart) {
    chart.destroy()
  }

  const mergedOptions = { ...defaultOptions, ...props.options }

  chart = new ChartJS(chartCanvas.value, {
    type: 'pie',
    data: props.data,
    options: mergedOptions
  })
}

onMounted(() => {
  createChart()
})

watch(() => props.data, () => {
  createChart()
}, { deep: true })

watch(() => props.options, () => {
  createChart()
}, { deep: true })
</script>

<style scoped>
.pie-chart-container {
  width: 100%;
  height: 200px;
  position: relative;
}
</style>