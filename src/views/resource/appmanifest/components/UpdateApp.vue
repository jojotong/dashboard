<template>
  <BaseDialog
    v-model="dialog"
    :width="1000"
    title="编辑应用"
    icon="mdi-apps"
    @reset="reset"
  >
    <template #content>
      <component
        :is="formComponent"
        :ref="formComponent"
        :edit="true"
      />
    </template>
    <template #action>
      <v-btn
        class="float-right"
        color="primary"
        text
        :loading="Circular"
        @click="updateApp"
      >
        确定
      </v-btn>
    </template>
  </BaseDialog>
</template>

<script>
import { mapState } from 'vuex'
import { getManifestDetail, putUpdateManifest } from '@/api'
import AppBaseForm from './AppBaseForm'

export default {
  name: 'UpdateAppManifest',
  components: {
    AppBaseForm,
  },
  mixins: [],
  data: () => ({
    dialog: false,
    formComponent: 'AppBaseForm',
  }),
  computed: {
    ...mapState(['Circular']),
  },
  methods: {
    // eslint-disable-next-line vue/no-unused-properties
    open() {
      this.dialog = true
    },
    async updateApp() {
      if (!this.$refs[this.formComponent]) {
        return
      }
      if (!this.$refs[this.formComponent].checkSaved()) {
        this.$store.commit('SET_SNACKBAR', {
          text: '请保存数据',
          color: 'warning',
        })
        return
      }
      if (this.$refs[this.formComponent].$refs.form.validate(true)) {
        const data = this.$refs[this.formComponent].obj
        await putUpdateManifest(data.TenantID, data.ProjectID, data.name, data)
        this.reset()
        this.$emit('refresh')
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    async init(item) {
      const data = await getManifestDetail(item.TenantID, item.ProjectID, item.name)
      this.$refs[this.formComponent].setData(Object.assign(data, {
        TenantID: item.TenantID,
        ProjectID: item.ProjectID,
      }))
    },
    reset() {
      this.dialog = false
      this.$refs[this.formComponent].reset()
    },
  },
}
</script>
