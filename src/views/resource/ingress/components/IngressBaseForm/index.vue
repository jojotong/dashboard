<template>
  <v-flex>
    <v-form
      ref="form"
      v-model="valid"
      lazy-validation
      @submit.prevent
    >
      <v-flex :class="expand ? 'kubegems__overlay' : ''" />
      <BaseSubTitle title="路由定义" />
      <v-card-text class="pa-2">
        <v-row v-if="manifest">
          <v-col cols="6">
            <v-autocomplete
              v-model="resourceKind"
              color="primary"
              :items="kinds"
              :rules="objRules.kindRule"
              :readonly="edit"
              label="资源"
              hide-selected
              class="my-0"
              no-data-text="暂无可选数据"
              @change="onKindChange"
            >
              <template #selection="{ item }">
                <v-chip
                  color="primary"
                  small
                  class="mx-1"
                >
                  {{ item['text'] }}
                </v-chip>
              </template>
            </v-autocomplete>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="6">
            <v-text-field
              v-model="obj.metadata.name"
              class="my-0"
              required
              label="名称"
              :rules="objRules.nameRule"
              :readonly="edit"
            />
          </v-col>
          <v-col
            v-if="AdminViewport && !manifest"
            cols="6"
          >
            <v-autocomplete
              v-model="obj.metadata.namespace"
              color="primary"
              :items="m_select_namespaceItems"
              :rules="objRules.namespaceRule"
              :readonly="edit"
              label="命名空间"
              hide-selected
              class="my-0"
              no-data-text="暂无可选数据"
              @focus="onNamespaceSelectFocus(ThisCluster)"
            >
              <template #selection="{ item }">
                <v-chip
                  color="primary"
                  small
                  class="mx-1"
                >
                  {{ item['text'] }}
                </v-chip>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col
            v-if="
              (!manifest || ThisAppEnvironmentID) &&
                Object.prototype.hasOwnProperty.call(obj.spec, 'ingressClassName')
            "
            cols="6"
          >
            <v-autocomplete
              v-model="obj.spec.ingressClassName"
              color="primary"
              label="声明网关"
              hide-selected
              class="my-0"
              no-data-text="暂无可选数据"
              :items="m_select_gatewayItems"
              :rules="objRules.ingressClassNameRule"
              @focus="onGatewaySelectFocus(ThisCluster)"
            >
              <template #selection="{ item }">
                <v-chip
                  color="primary"
                  small
                  class="mx-1"
                >
                  {{ item['text'] }}
                </v-chip>
              </template>
            </v-autocomplete>
          </v-col>
        </v-row>
      </v-card-text>

      <IngressRuleForm
        ref="ingressRuleForm"
        :obj="obj"
        :domain="baseDomain"
        @addData="addRulerData"
        @closeOverlay="closeExpand"
      />
      <BaseSubTitle title="路由规则" />
      <v-card-text class="pa-2">
        <IngressRuleItem
          :rules="obj.spec.rules"
          :tls="obj.spec.tls"
          :obj="obj"
          @updatePort="updatePort"
          @removePort="removePort"
          @expandCard="expandCard"
        />
      </v-card-text>

      <AnnotationForm
        ref="annotationForm"
        :data="obj.metadata.annotations"
        @addData="addAnnotationData"
        @closeOverlay="closeExpand"
      />
      <BaseSubTitle title="注解">
        <template #tips>
          <v-icon
            small
            right
            color="warning"
            class="mt-n1 kubegems__pointer"
            @click="help"
          >
            mdi-information-variant
          </v-icon>
        </template>
      </BaseSubTitle>
      <v-card-text class="pa-2">
        <AnnotationItem
          :annotations="obj.metadata.annotations"
          @updateAnnotations="updateAnnotations"
          @removeAnnotations="removeAnnotations"
          @expandCard="expandCard"
        />
        <div class="kubegems__clear-float" />
      </v-card-text>
    </v-form>
  </v-flex>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import IngressRuleItem from './IngressRuleItem'
import AnnotationItem from '@/views/resource/components/annotation/AnnotationItem'
import IngressRuleForm from './IngressRuleForm'
import AnnotationForm from '@/views/resource/components/annotation/AnnotationForm'
import BaseSelect from '@/mixins/select'
import BaseResource from '@/mixins/resource'
import { deepCopy } from '@/utils/helpers'
import { k8sName, required } from '@/utils/rules'

export default {
  name: 'IngressBaseForm',
  components: {
    IngressRuleItem,
    AnnotationItem,
    IngressRuleForm,
    AnnotationForm,
  },
  mixins: [BaseSelect, BaseResource],
  props: {
    item: {
      type: Object,
      default: () => null,
    },
    edit: {
      type: Boolean,
      default: () => false,
    },
    kind: {
      type: String,
      default: () => 'Ingress',
    },
    manifest: {
      type: Boolean,
      default: () => false,
    },
    kinds: {
      type: Array,
      default: () => [],
    },
    app: {
      type: Object,
      default: () => {},
    },
  },
  data: () => ({
    valid: false,
    expand: false,
    resourceKind: '',
    obj: {
      apiVersion: 'extensions/v1beta1',
      kind: 'Ingress',
      metadata: {
        name: '',
        namespace: '',
        annotations: {},
      },
      spec: {
        ingressClassName: '',
        tls: [],
        rules: [],
      },
    },
  }),
  computed: {
    ...mapState(['Admin', 'AdminViewport']),
    ...mapGetters(['Tenant', 'Cluster']),
    objRules() {
      return {
        nameRule: [
          required,
          k8sName,
        ],
        namespaceRule: [required],
        // ingressClassNameRule: [required],
        kindRule: [required],
      }
    },
    baseDomain() {
      const gateway = this.m_select_gatewayItems.find((g) => {
        return g.value === this.obj.spec.ingressClassName
      })
      if (gateway) {
        return gateway.baseDomain
      }
      return ''
    },
  },
  watch: {
    item() {
      this.loadData(true)
    },
  },
  mounted() {
    this.loadData(false)
  },
  methods: {
    loadData(cover = false) {
      this.$nextTick(() => {
        if (cover) {
          if (!this.item) {
            this.obj = this.$options.data().obj
            this.$refs.form.resetValidation()
          } else {
            this.obj = deepCopy(this.item)
          }
        } else {
          if (!this.manifest) {
            if (this.AdminViewport) {
              this.m_select_namespaceSelectData(this.ThisCluster)
            } else {
              this.obj.metadata.namespace = this.ThisNamespace
            }
            this.m_select_gatewaySelectData(this.ThisCluster)
          } else {
            this.obj.metadata.name = `${this.app.ApplicationName}`
          }
        }
        if (!this.obj.metadata.annotations) {
          this.obj.metadata.annotations = {}
        }
        this.resourceKind = this.kind
        this.obj.kind = this.kind
      })
    },
    getTLS(rule, tls) {
      let basePrefix = 'http'
      let prefix = 'http'
      let secret = ''
      if (this.obj.metadata.annotations) {
        if (this.obj.metadata.annotations['nginx.org/websocket-services']) {
          if (
            rule.http.paths.find((p) => {
              return (
                this.obj.metadata.annotations['nginx.org/websocket-services']
                  .split(',')
                  .indexOf(p.backend.serviceName) > -1
              )
            })
          ) {
            basePrefix = 'ws'
            prefix = 'ws'
          }
        } else if (this.obj.metadata.annotations['nginx.org/grpc-services']) {
          if (
            rule.http.paths.find((p) => {
              return (
                this.obj.metadata.annotations['nginx.org/grpc-services']
                  .split(',')
                  .indexOf(p.backend.serviceName) > -1
              )
            })
          ) {
            basePrefix = 'grpc'
            prefix = 'grpc'
          }
        }
      }
      if (tls) {
        tls.forEach((t) => {
          const i = t.hosts.findIndex((h) => {
            return h === rule.host
          })
          if (i > -1) {
            if (basePrefix === 'http') prefix = 'https'
            else if (basePrefix === 'ws') prefix = 'wss'
            else if (basePrefix === 'grpc') prefix = 'grpc'
            secret = t.secretName
            return
          }
        })
      }
      return { protocol: `${prefix}`, secretName: secret }
    },
    addAnnotationData(data) {
      this.obj.metadata.annotations = data
      this.$refs.annotationForm.closeCard()
    },
    addRulerData(data) {
      this.obj = data
      this.$refs.ingressRuleForm.closeCard()
    },
    updatePort(index) {
      const rule = this.obj.spec.rules[index]
      const tls = this.obj.spec.tls
        ? this.obj.spec.tls
        : [{ hosts: [], secretName: '' }]
      const ruler = {}
      ruler.index = index
      ruler.host = rule.host
      const tlsDict = this.getTLS(rule, tls)
      ruler.tls = tlsDict.protocol
      ruler.secretName = tlsDict.secretName
      const paths = []
      rule.http.paths.forEach((p) => {
        paths.push({
          path: p.path,
          serviceName: p.backend.serviceName,
          servicePort: p.backend.servicePort,
        })
      })
      ruler.paths = paths
      this.$nextTick(() => {
        this.$refs.ingressRuleForm.init(ruler)
        this.expand = true
      })
    },
    removePort(index) {
      this.$delete(this.obj.spec.rules, index)
      if (this.obj.spec.tls) {
        this.$delete(this.obj.spec.tls, index)
      }
    },
    updateAnnotations(key) {
      const data = { key: key, value: this.obj.metadata.annotations[key] }
      this.$nextTick(() => {
        this.$refs.annotationForm.init(data)
        this.expand = true
      })
    },
    removeAnnotations(key) {
      this.$delete(this.obj.metadata.annotations, key)
    },
    expandCard(formComponent) {
      this.$nextTick(() => {
        this.$refs[formComponent].expand = true
        this.$refs[formComponent].$refs.form.resetValidation()
        this.expand = true
      })
    },
    closeExpand() {
      this.expand = false
    },
    // eslint-disable-next-line vue/no-unused-properties
    checkSaved() {
      if (this.$refs.annotationForm.expand) {
        return !this.$refs.annotationForm.expand
      }
      if (this.$refs.ingressRuleForm.expand) {
        return !this.$refs.ingressRuleForm.expand
      }
      return true
    },
    // eslint-disable-next-line vue/no-unused-properties
    init(data) {
      this.$nextTick(() => {
        this.obj = deepCopy(data)
      })
    },
    // eslint-disable-next-line vue/no-unused-properties
    back(data) {
      this.$nextTick(() => {
        this.obj = deepCopy(data)
      })
    },
    onKindChange() {
      this.$emit('change', this.resourceKind)
    },
    // eslint-disable-next-line vue/no-unused-properties
    reset() {
      if (this.$refs.annotationForm) this.$refs.annotationForm.closeCard()
      this.$refs.ingressRuleForm.closeCard()
      this.$refs.form.reset()
    },
    help() {
      window.open(
        'https://docs.nginx.com/nginx-ingress-controller/configuration/ingress-resources/advanced-configuration-with-annotations',
      )
    },
    // eslint-disable-next-line vue/no-unused-properties
    setData(data) {
      this.obj = data
    },
    onNamespaceSelectFocus(clusterName) {
      this.m_select_namespaceSelectData(clusterName)
    },
    onGatewaySelectFocus(clusterName) {
      this.m_select_gatewaySelectData(clusterName)
    },
  },
}
</script>
