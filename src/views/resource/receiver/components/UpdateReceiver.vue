<template>
  <BaseDialog
    v-model="dialog"
    :width="1000"
    title="更新接收器"
    icon="mdi-call-received"
    @reset="reset"
  >
    <template #content>
      <component
        :is="formComponent"
        :ref="formComponent"
        :item="item"
        title="Receiver"
        :edit="true"
      />
    </template>
    <template #action>
      <v-btn
        class="float-right mx-2"
        color="primary"
        text
        :loading="Circular"
        @click="updateReceiver"
      >
        确定
      </v-btn>
    </template>
  </BaseDialog>
</template>

<script>
import { mapState } from 'vuex'
import { putUpdateReceiver } from '@/api'
import ReceiverBaseForm from './ReceiverBaseForm'
import BaseResource from '@/mixins/resource'
import { deepCopy } from '@/utils/helpers'

export default {
  name: 'UpdateReceiver',
  components: {
    ReceiverBaseForm,
  },
  mixins: [BaseResource],
  data: () => ({
    dialog: false,
    formComponent: 'ReceiverBaseForm',
    item: {},
  }),
  computed: {
    ...mapState(['Circular', 'AdminViewport']),
  },
  methods: {
    // eslint-disable-next-line vue/no-unused-properties
    open() {
      this.dialog = true
    },
    // 点击编辑后调用
    // eslint-disable-next-line vue/no-unused-properties
    async init(item) {
      this.$nextTick(() => {
        // 提前加载命名空间
        if (this.AdminViewport) {
          this.$refs[this.formComponent].updateNamespaceSelectData()
          this.$refs[this.formComponent].namespace = item.namespace
        }
        this.item = deepCopy(item)
      })
    },
    async updateReceiver() {
      if (
        this.$refs[this.formComponent].$refs.form.validate(true) &&
        this.$refs[this.formComponent].validate()
      ) {
        let data = this.$refs[this.formComponent].obj
        data = this.m_resource_beautifyData(data)
        if (!this.AdminViewport) {
          await putUpdateReceiver(
            this.ThisCluster,
            this.ThisNamespace,
            data.name,
            data,
          )
        } else {
          await putUpdateReceiver(
            this.ThisCluster,
            this.$refs[this.formComponent].namespace,
            data.name,
            data,
          )
        }

        this.reset()
        this.$emit('refresh')
      }
    },
    reset() {
      this.dialog = false
      this.$refs[this.formComponent].reset()
      this.formComponent = 'ReceiverBaseForm'
    },
  },
}
</script>
