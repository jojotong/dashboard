<template>
  <BaseDialog
    v-model="dialog"
    :width="1000"
    title="资源超分"
    icon="mdi-scale"
    @reset="reset"
  >
    <template #content>
      <BaseSubTitle :title="`集群${item ? item.ClusterName : ''}`" />
      <v-card-text class="px-0 pb-0 mt-2">
        <v-row>
          <v-col
            cols="4"
            class="py-0"
          >
            <VueApexCharts
              type="radialBar"
              height="250"
              :options="cpuOptions"
              :series="cpuSeries"
            />
          </v-col>
          <v-col
            cols="4"
            class="py-0"
          >
            <VueApexCharts
              type="radialBar"
              height="250"
              :options="memoryOptions"
              :series="memorySeries"
            />
          </v-col>
          <v-col
            cols="4"
            class="py-0"
          >
            <VueApexCharts
              type="radialBar"
              height="250"
              :options="storageOptions"
              :series="storageSeries"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <BaseSubTitle title="资源超分" />
      <v-form
        ref="form"
        v-model="valid"
        lazy-validation
        class="mt-4 mx-1"
        @submit.prevent
      >
        <v-row>
          <v-col
            cols="4"
            class="px-2 py-0"
          >
            <v-sheet class="pa-2">
              <v-flex class="text-subtitle-1">
                超分CPU
                <span class="text-subtitle-2 primary--text">
                  {{ overResource.cpu.toFixed(1) }} core
                </span>
                总CPU
                <span class="text-subtitle-2 primary--text">
                  {{ quota ? quota.Cpu.toFixed(1) : 0 }}
                  core
                </span>
              </v-flex>
              <v-text-field
                v-model="obj.OversoldConfig.cpu"
                class="my-0"
                required
                type="number"
                label="CPU超分比例"
                :rules="objRules.CpuRules"
                @keyup="onOversoldInput('cpu')"
              />
            </v-sheet>
          </v-col>
          <v-col
            cols="4"
            class="px-2 py-0"
          >
            <v-sheet class="pa-2">
              <v-flex class="text-subtitle-1">
                超分内存
                <span class="text-subtitle-2 primary--text">
                  {{ overResource.memory.toFixed(1) }} Gi
                </span>
                总内存
                <span class="text-subtitle-2 primary--text">
                  {{ quota ? quota.Memory.toFixed(1) : 0 }}
                  Gi
                </span>
              </v-flex>
              <v-text-field
                v-model="obj.OversoldConfig.memory"
                class="my-0"
                required
                type="number"
                label="内存超分比例"
                :rules="objRules.MemoryRules"
                @keyup="onOversoldInput('memory')"
              />
            </v-sheet>
          </v-col>
          <v-col
            cols="4"
            class="px-2 py-0"
          >
            <v-sheet class="pa-2">
              <v-flex class="text-subtitle-1">
                超分存储
                <span class="text-subtitle-2 primary--text">
                  {{ overResource.storage.toFixed(1) }} Gi
                </span>
                总存储
                <span class="text-subtitle-2 primary--text">
                  {{ quota ? quota.Storage.toFixed(1) : 0 }}
                  Gi
                </span>
              </v-flex>
              <v-text-field
                v-model="obj.OversoldConfig.storage"
                class="my-0"
                required
                type="number"
                label="存储超分比例"
                :rules="objRules.StorageRules"
                @keyup="onOversoldInput('storage')"
              />
            </v-sheet>
          </v-col>
        </v-row>
      </v-form>
    </template>
    <template #action>
      <v-btn
        class="float-right"
        color="primary"
        text
        :loading="Circular"
        @click="oversoldClusterResource"
      >
        确定
      </v-btn>
    </template>
  </BaseDialog>
</template>

<script>
import { mapState } from 'vuex'
import { getClusterQuota, putUpdateCluster } from '@/api'
import VueApexCharts from 'vue-apexcharts'
import BaseResource from '@/mixins/resource'
import { generateRadialBarChartOptions } from '@/utils/chart'
import { deepCopy, sizeOfCpu, sizeOfStorage } from '@/utils/helpers'
import { required } from '@/utils/rules'

export default {
  name: 'OverScaleResource',
  components: {
    VueApexCharts,
  },
  mixins: [BaseResource],
  data: () => ({
    dialog: false,
    valid: false,
    item: null,
    quota: null,
    overResource: {
      cpu: 0,
      memory: 0,
      storage: 0,
    },
    obj: {
      OversoldConfig: {
        cpu: 1,
        memory: 1,
        storage: 1,
      },
    },
  }),
  computed: {
    ...mapState(['Circular']),
    objRules() {
      return {
        CpuRules: [
          required,
          (v) =>
            !!new RegExp('^\\d+\\.?\\d?$').test(v) ||
            '格式错误(示例:最多1位小数)',
          (v) => parseInt(v) >= 1 || '低于最小限制',
          (v) => parseInt(v) <= 20 || '超出最大限制',
        ],
        MemoryRules: [
          required,
          (v) =>
            !!new RegExp('^\\d+\\.?\\d?$').test(v) ||
            '格式错误(示例:最多1位小数)',
          (v) => parseInt(v) >= 1 || '低于最小限制',
          (v) => parseInt(v) <= 20 || '超出最大限制',
        ],
        StorageRules: [
          required,
          (v) =>
            !!new RegExp('^\\d+\\.?\\d?$').test(v) ||
            '格式错误(示例:最多1位小数)',
          (v) => parseInt(v) >= 1 || '低于最小限制',
          (v) => parseInt(v) <= 20 || '超出最大限制',
        ],
      }
    },
    cpuSeries() {
      return this.quota
        ? [
            (this.quota.Cpu / this.quota.AllocatedCpu) * 100,
            (this.quota.UsedCpu / this.quota.AllocatedCpu) * 100,
          ]
        : [0, 0]
    },
    cpuOptions() {
      return generateRadialBarChartOptions(
        '超分CPU',
        ['总CPU', '使用CPU'],
        this.quota ? this.quota.AllocatedCpu : 0,
        'core',
        true,
      )
    },
    memorySeries() {
      return this.quota
        ? [
            (this.quota.Memory / this.quota.AllocatedMemory) * 100,
            (this.quota.UsedMemory / this.quota.AllocatedMemory) * 100,
          ]
        : [0, 0]
    },
    memoryOptions() {
      return generateRadialBarChartOptions(
        '超分内存',
        ['总内存', '使用内存'],
        this.quota ? this.quota.AllocatedMemory : 0,
        'Gi',
        true,
      )
    },
    storageSeries() {
      return this.quota
        ? [
            (this.quota.Storage / this.quota.AllocatedStorage) * 100,
            (this.quota.UsedStorage / this.quota.AllocatedStorage) * 100,
          ]
        : [0, 0]
    },
    storageOptions() {
      return generateRadialBarChartOptions(
        '超分存储',
        ['总存储', '使用存储'],
        this.quota ? this.quota.AllocatedStorage : 0,
        'Gi',
        true,
      )
    },
  },
  methods: {
    // eslint-disable-next-line vue/no-unused-properties
    open() {
      this.dialog = true
    },
    async oversoldClusterResource() {
      if (this.$refs.form.validate(true)) {
        this.obj.OversoldConfig = {
          cpu: parseFloat(this.obj.OversoldConfig.cpu),
          memory: parseFloat(this.obj.OversoldConfig.memory),
          storage: parseFloat(this.obj.OversoldConfig.storage),
        }
        await putUpdateCluster(this.item.ID, {
          OversoldConfig: this.obj.OversoldConfig,
        })
        this.reset()
        this.$emit('refresh')
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    async init(item) {
      this.item = deepCopy(item)
      if (this.item.OversoldConfig) {
        this.obj.OversoldConfig = this.item.OversoldConfig
      }
      this.clusterQuota()
    },
    async clusterQuota() {
      const data = await getClusterQuota(this.item.ID, {
        noprocessing: true,
      })
      this.quota = {
        Cpu: sizeOfCpu(data.resources.capacity['cpu']),
        UsedCpu: sizeOfCpu(data.resources.used['cpu']),
        AllocatedCpu:
          sizeOfCpu(data.resources.capacity['cpu']) *
          this.obj.OversoldConfig.cpu,
        Memory: sizeOfStorage(data.resources.capacity['memory']),
        UsedMemory: sizeOfStorage(data.resources.used['memory']),
        AllocatedMemory:
          sizeOfStorage(data.resources.capacity['memory']) *
          this.obj.OversoldConfig.memory,
        Storage: sizeOfStorage(data.resources.capacity['ephemeral-storage']),
        UsedStorage: sizeOfStorage(data.resources.used['ephemeral-storage']),
        AllocatedStorage:
          sizeOfStorage(data.resources.capacity['ephemeral-storage']) *
          this.obj.OversoldConfig.storage,
      }
      this.overResource = {
        cpu: this.quota.Cpu * this.obj.OversoldConfig.cpu,
        memory: this.quota.Memory * this.obj.OversoldConfig.memory,
        storage: this.quota.Storage * this.obj.OversoldConfig.storage,
      }
    },
    onOversoldInput(type) {
      if (type === 'cpu') {
        if (
          !isNaN(this.obj.OversoldConfig.cpu) &&
          this.obj.OversoldConfig.cpu !== '' &&
          this.quota.Cpu
        ) {
          this.$set(
            this.overResource,
            'cpu',
            this.quota.Cpu * this.obj.OversoldConfig.cpu,
          )
          this.quota.AllocatedCpu = this.quota.Cpu * this.obj.OversoldConfig.cpu
        }
      } else if (type === 'memory') {
        if (
          !isNaN(this.obj.OversoldConfig.memory) &&
          this.obj.OversoldConfig.memory !== '' &&
          this.quota.Memory
        ) {
          this.$set(
            this.overResource,
            'memory',
            this.quota.Memory * this.obj.OversoldConfig.memory,
          )
          this.quota.AllocatedMemory =
            this.quota.Memory * this.obj.OversoldConfig.memory
        }
      } else if (type === 'storage') {
        if (
          !isNaN(this.obj.OversoldConfig.storage) &&
          this.obj.OversoldConfig.storage !== '' &&
          this.quota.Storage
        ) {
          this.$set(
            this.overResource,
            'storage',
            this.quota.Storage * this.obj.OversoldConfig.storage,
          )
          this.quota.AllocatedStorage =
            this.quota.Storage * this.obj.OversoldConfig.storage
        }
      }
    },
    reset() {
      this.dialog = false
      this.obj = {
        OversoldConfig: {
          cpu: 1,
          memory: 1,
          storage: 1,
        },
      }
    },
  },
}
</script>
