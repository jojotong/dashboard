<template>
  <BaseDialog
    v-model="dialog"
    :width="1000"
    title="创建环境"
    icon="mdi-cube"
    @reset="reset"
  >
    <template #content>
      <component
        :is="formComponent"
        :ref="formComponent"
        :step="step"
      />
    </template>
    <template #action>
      <v-btn
        v-if="step === 2"
        class="float-right mx-2"
        color="primary"
        text
        :loading="Circular"
        @click="addEnvironment"
      >
        确定
      </v-btn>
      <v-btn
        v-if="step < 2"
        class="float-right mx-2"
        color="primary"
        text
        @click="check"
      >
        下一步
      </v-btn>
      <v-btn
        v-if="step > 0"
        class="float-right mx-2"
        color="primary"
        text
        @click="step -= 1"
      >
        上一步
      </v-btn>
    </template>
  </BaseDialog>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { postAddEnvironment, postAddEnvironmentUser } from '@/api'
import EnvironmentBaseForm from './EnvironmentBaseForm'
import BaseSelect from '@/mixins/select'

export default {
  name: 'AddEnvironment',
  components: {
    EnvironmentBaseForm,
  },
  mixins: [BaseSelect],
  data: () => ({
    dialog: false,
    formComponent: 'EnvironmentBaseForm',
    projectid: 0,
    step: 0,
  }),
  computed: {
    ...mapState(['Circular', 'User', 'AdminViewport']),
    ...mapGetters(['Project']),
  },
  methods: {
    // eslint-disable-next-line vue/no-unused-properties
    open() {
      this.dialog = true
    },
    check() {
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
        this.step += 1
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    init(projectID) {
      this.$nextTick(() => {
        this.$refs[this.formComponent].initUser(projectID)
      })
    },
    async addEnvironment() {
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
        const data = this.$refs[this.formComponent].obj.data
        const resdata = await postAddEnvironment(
          this.AdminViewport
            ? data.ProjectID
            : this.projectid > 0
            ? this.projectid
            : this.Project().ID,
          {
            EnvironmentName: data.EnvironmentName,
            ClusterID: data.ClusterID,
            MetaType: data.MetaType,
            Namespace: data.Namespace,
            DeletePolicy: data.DeletePolicy,
            ProjectID: this.AdminViewport
              ? data.ProjectID
              : this.projectid > 0
              ? this.projectid
              : this.Project().ID,
            Remark: data.Remark,
            CreatorID: this.User.ID,
            ResourceQuota:
              this.$refs[this.formComponent].$refs.resourceQuota.generateUnit(),
            LimitRange: data.LimitRange,
          },
        )
        if (data.Users.length > 0) {
          data.Users.forEach((user) => {
            postAddEnvironmentUser(resdata.ID, {
              EnvironmentID: resdata.ID,
              UserID: user.ID,
              Role: user.Role,
            })
          })
        }
        if (this.Project().ID === resdata.ProjectID) {
          await this.m_select_projectEnvironmentSelectData(resdata.ProjectID)
        }
        this.reset()
        this.$emit('refresh', {
          ID: resdata.ProjectID,
        })
      }
    },
    reset() {
      this.dialog = false
      this.step = 0
      this.$refs[this.formComponent].reset()
    },
  },
}
</script>
