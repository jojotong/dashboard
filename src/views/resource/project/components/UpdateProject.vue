<template>
  <BaseDialog
    v-model="dialog"
    :width="1000"
    title="更新项目"
    icon="mdi-cube-outline"
    @reset="reset"
  >
    <template #content>
      <component
        :is="formComponent"
        :ref="formComponent"
        :edit="true"
        :step="step"
      />
    </template>
    <template #action>
      <v-btn
        v-if="step === 1"
        class="float-right mx-2"
        color="primary"
        text
        :loading="Circular"
        @click="updateProject"
      >
        确定
      </v-btn>
      <v-btn
        v-if="step === 1"
        class="float-right mx-2"
        color="primary"
        text
        @click="step = 0"
      >
        上一步
      </v-btn>
      <v-btn
        v-if="step === 0"
        class="float-right mx-2"
        color="primary"
        text
        @click="check"
      >
        下一步
      </v-btn>
    </template>
  </BaseDialog>
</template>

<script>
import { mapState } from 'vuex'
import { getProjectDetail, putUpdateProject } from '@/api'
import ProjectBaseForm from './ProjectBaseForm'
import BaseSelect from '@/mixins/select'
import { deepCopy } from '@/utils/helpers'

export default {
  name: 'UpdateProject',
  components: {
    ProjectBaseForm,
  },
  mixins: [BaseSelect],
  data: () => ({
    dialog: false,
    formComponent: 'ProjectBaseForm',
    step: 0,
  }),
  computed: {
    ...mapState(['Circular']),
  },
  methods: {
    // eslint-disable-next-line vue/no-unused-properties
    open() {
      this.dialog = true
    },
    check() {
      if (this.$refs[this.formComponent].validated()) this.step = 1
    },
    async updateProject() {
      if (this.$refs[this.formComponent].$refs.form.validate(true)) {
        const data = this.$refs[this.formComponent].obj
        await putUpdateProject(data.ProjectID, {
          ProjectID: data.ProjectID,
          ProjectName: data.ProjectName,
          ProjectAlias: data.ProjectAlias,
          Remark: data.Remark,
        })

        await this.m_select_tenantProjectSelectData()
        this.reset()
        this.$emit('refresh')
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    async init(project) {
      const data = await getProjectDetail(project.ID)
      const item = deepCopy(data)
      this.$refs[this.formComponent].setData({
        ProjectID: item.ID,
        ProjectName: item.ProjectName,
        ProjectAlias: item.ProjectAlias,
        Remark: item.Remark,
      })
      this.$refs[this.formComponent].init()
    },
    reset() {
      this.dialog = false
      this.$refs[this.formComponent].reset()
      this.step = 0
    },
  },
}
</script>
