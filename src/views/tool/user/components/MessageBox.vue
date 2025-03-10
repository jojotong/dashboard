<template>
  <v-card
    flat
    class="pa-2"
  >
    <v-card-title class="pa-0">
      <v-chip-group
        v-model="messageType"
        column
        class="ml-2 align-center"
        @change="onMessageTypeChange"
      >
        <v-chip
          v-for="(item, index) in messageTypeItems"
          :key="index"
          label
          small
          :outlined="messageType !== index"
          :color="item.color"
          class="font-weight-medium"
          :text-color="`${messageType !== index ? item.color : 'white'}`"
        >
          {{ item.text }}
        </v-chip>
      </v-chip-group>
    </v-card-title>
    <v-data-table
      class="mx-2"
      disable-sort
      :headers="headers"
      :items="items"
      :page.sync="params.page"
      :items-per-page="params.size"
      no-data-text="暂无数据"
      hide-default-footer
      calculate-widths
    >
      <template #[`item.createdAt`]="{ item }">
        {{ item.CreatedAt ? $moment(item.CreatedAt).format('lll') : '' }}
      </template>
      <template #[`item.title`]="{ item }">
        {{ item.Title }}
      </template>
      <template #[`item.messageType`]="{ item }">
        {{ messageTypeCn[item.MessageType] }}
      </template>
    </v-data-table>
    <BasePagination
      v-if="pageCount >= 1"
      v-model="params.page"
      :page-count="pageCount"
      :size="params.size"
      @loaddata="messageList"
      @changesize="onPageSizeChange"
      @changepage="onPageIndexChange"
    />
  </v-card>
</template>

<script>
import { mapState } from 'vuex'
import { getMessageList } from '@/api'

export default {
  name: 'MessageBox',
  data() {
    return {
      items: [],
      headers: [
        { text: '时间', value: 'createdAt', align: 'start', width: 220 },
        { text: '消息', value: 'title', align: 'start' },
        { text: '类型', value: 'messageType', align: 'end', width: 50 },
        { text: '', value: '', align: 'end', width: 30 },
      ],
      pageCount: 0,
      messageTypeCn: {
        alert: '告警',
        message: '通知',
        approve: '审批',
      },
      messageType: null,
      messageTypeItems: [
        { text: '通知', color: 'success', value: 'message' },
        { text: '审批', color: 'primary', value: 'approve' },
        { text: '告警', color: 'error', value: 'alert' },
      ],
    }
  },
  computed: {
    ...mapState(['JWT', 'User']),
    params() {
      return {
        page: 1,
        size: 20,
        is_read: true,
        message_type:
          this.messageType || this.messageType === 0
            ? this.messageTypeItems[this.messageType].value
            : null,
      }
    },
  },
  mounted() {
    if (this.JWT) {
      this.messageList()
    }
  },
  methods: {
    onMessageTypeChange() {
      this.messageList()
    },
    async messageList(noprocess = false) {
      const data = await getMessageList(
        Object.assign(this.params, { noprocessing: noprocess }),
      )
      this.items = data.List
      this.pageCount = Math.ceil(data.Total / this.params.size)
      this.params.page = data.CurrentPage
    },
    onPageSizeChange(size) {
      this.params.page = 1
      this.params.size = size
    },
    onPageIndexChange(page) {
      this.params.page = page
    },
  },
}
</script>
