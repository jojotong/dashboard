<template>
  <BaseDialog
    v-model="dialog"
    :width="1000"
    title="更新Installer配置"
    icon="mdi-file-document"
    @reset="reset"
  >
    <template #content>
      <component
        :is="formComponent"
        :ref="formComponent"
        :item="item"
        :edit="true"
        title="Installer"
      />
    </template>
    <template #action>
      <v-btn
        class="float-right"
        color="primary"
        text
        :loading="Circular"
        @click="updateSystemConfig"
      >
        确定
      </v-btn>
    </template>
  </BaseDialog>
</template>

<script>
import { mapState } from 'vuex'
import {
  getSystemConfigData,
  putSystemConfigData,
} from '@/api'
import BaseResource from '@/mixins/resource'
import { deepCopy } from '@/utils/helpers'

export default {
  name: 'SetInstaller',
  mixins: [BaseResource],
  data: () => ({
    dialog: false,
    installer: null,
    item: null,
    formComponent: 'BaseYamlForm',
  }),
  computed: {
    ...mapState(['Circular']),
  },
  methods: {
    // eslint-disable-next-line vue/no-unused-properties
    open() {
      this.dialog = true
    },
    async updateSystemConfig() {
      if (this.$refs[this.formComponent].$refs.form.validate(true)) {
        let data = ''
        if (this.formComponent === 'BaseYamlForm') {
          data = this.$refs[this.formComponent].kubeyaml
          data = this.$yamlload(data)
          data = this.m_resource_beautifyData(data)
          this.installer.content.installer_yaml = data
        }
        await putSystemConfigData(
          this.installer.name,
          this.installer,
        )
        this.reset()
        this.$emit('refresh')
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    async init(item) {
      const data = await getSystemConfigData(
        item.name,
      )
      this.installer = deepCopy(data)
      this.item = this.installer.content.installer_yaml
    },
    reset() {
      this.dialog = false
      this.$refs[this.formComponent].reset()
      this.formComponent = 'BaseYamlForm'
    },
  },
}
</script>
