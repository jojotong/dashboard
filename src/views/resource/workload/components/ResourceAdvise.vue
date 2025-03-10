<template>
  <div v-if="adviseItem">
    <BaseTipWindow
      :top="top"
      icon="mdi-feather"
      title="资源建议"
    >
      <template #header>
        <v-icon
          small
          :color="getCondition(adviseItem).color"
          @click="scaleResourceLimit"
        >
          {{ getCondition(adviseItem).icon }}
        </v-icon>
        <span
          :class="`text-caption ${getCondition(
            adviseItem,
          ).color}--text font-weight-medium kubegems__pointer kubegems__attach-position`"
        >
          {{ getCondition(adviseItem).text }}
        </span>
      </template>
      <template #content>
        <v-list-item
          v-for="(container, containerName, index) in adviseItem.Conditions"
          :key="containerName"
        >
          <v-list-item-content>
            <v-list-item-title>
              容器
              <v-btn
                v-if="index == 0"
                text
                x-small
                color="warning"
                absolute
                right
                @click="clearAdvise"
              >
                忽略
              </v-btn>
            </v-list-item-title>
            <v-list-item-content class="text-caption kubegems__detail">
              {{ containerName }}
            </v-list-item-content>
            <template v-if="container.CPUStatus !== null">
              <v-list-item-title>CPU</v-list-item-title>
              <v-list-item-content class="text-caption kubegems__detail">
                {{ showAdvise(container.CPUStatus, 'CPU') }}
              </v-list-item-content>
            </template>
            <template v-if="container.MemoryStatus !== null">
              <v-list-item-title>内存</v-list-item-title>
              <v-list-item-content class="text-caption kubegems__detail">
                {{ showAdvise(container.MemoryStatus, '内存') }}
              </v-list-item-content>
            </template>
            <v-list-item-title>Pods(建议调整)</v-list-item-title>
            <v-list-item-content class="text-caption kubegems__detail my-0">
              <v-flex
                v-for="(pod, podIndex) in container.Pods"
                :key="podIndex"
                class="text-caption kubegems__detail"
              >
                {{ pod }}
              </v-flex>
            </v-list-item-content>
          </v-list-item-content>
        </v-list-item>
      </template>
    </BaseTipWindow>
  </div>
</template>

<script>
import { deleteWorkloadResourceAdvise } from '@/api'

export default {
  name: 'ResourceAdvise',
  props: {
    item: {
      type: Object,
      default: () => null,
    },
    adviseItem: {
      type: Object,
      default: () => null,
    },
    kind: {
      type: String,
      default: () => '',
    },
    top: {
      type: Boolean,
      default: () => false,
    },
  },
  methods: {
    getCondition(item) {
      if (item?.Conditions?.reviews?.CPUStatus?.Status === 'low' &&
      item?.Conditions?.reviews?.MemoryStatus?.Status === 'low') {
        return { color: 'success', text: '资源推荐缩容', icon: 'mdi-download' }
      } else if (item?.Conditions?.reviews?.CPUStatus?.Status === 'high' &&
       item?.Conditions?.reviews?.MemoryStatus?.Status === 'high') {
        return { color: 'warning', text: '资源推荐扩容', icon: 'mdi-upload' }
      } else if (item?.Conditions?.reviews?.CPUStatus?.Status === 'low' &&
       !item?.Conditions?.reviews?.MemoryStatus) {
        return { color: 'warning', text: '资源推荐CPU缩容', icon: 'mdi-download' }
      } else if (item?.Conditions?.reviews?.CPUStatus?.Status === 'high' &&
       !item?.Conditions?.reviews?.MemoryStatus) {
        return { color: 'warning', text: '资源推荐CPU扩容', icon: 'mdi-upload' }
      } else if (item?.Conditions?.reviews?.MemoryStatus?.Status === 'low' &&
       !item?.Conditions?.reviews?.CPUStatus) {
        return { color: 'warning', text: '资源推荐内存缩容', icon: 'mdi-download' }
      } else if (item?.Conditions?.reviews?.MemoryStatus?.Status === 'high' &&
       !item?.Conditions?.reviews?.CPUStatus) {
        return { color: 'warning', text: '资源推荐内存扩容', icon: 'mdi-upload' }
      }
      return { color: 'warning', text: '资源推荐', icon: 'mdi-clipboard-alert' }
    },
    showAdvise(advise, prefex) {
      let showStr = ''
      switch (advise.Status) {
        case 'low':
          showStr = `过去一周${prefex}使用率95峰值:${(
            advise.CurrentRate * 100
          ).toFixed(2)}%,偏低,当前限制:${advise.CurrentLimit},建议缩容至:${
            advise.SuggestLimit
          };`
          advise.Action = 'scaleDown'

          break
        case 'high':
          showStr = `过去一周${prefex}使用率95峰值:${(
            advise.CurrentRate * 100
          ).toFixed(2)}%,偏高,当前限制:${advise.CurrentLimit},建议扩容至:${
            advise.SuggestLimit
          };`
          advise.Action = 'scaleUp'
          break
        case 'very_high':
          showStr = `过去一周${prefex}使用率95峰值:${(
            advise.CurrentRate * 100
          ).toFixed(2)}%,非常高,当前限制:${advise.CurrentLimit},建议扩容至:${
            advise.SuggestLimit
          };`
          advise.Action = 'scaleUp'
          break
      }
      advise.Suggestion = showStr
      return showStr
    },
    scaleResourceLimit() {
      this.$emit('scaleResourceLimit', this.item, this.kind, this.adviseItem)
    },
    async clearAdvise() {
      await deleteWorkloadResourceAdvise(this.adviseItem.ID)
      this.$emit('clearAdvise', this.adviseItem)
    },
  },
}
</script>

<style lang="scss" scoped>
.v-list-item__content {
  word-break: break-all;
}
</style>
