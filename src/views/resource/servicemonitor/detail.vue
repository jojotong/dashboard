<template>
  <v-container fluid>
    <BaseViewportHeader :selectable="false" />
    <BaseBreadcrumb :breadcrumb="breadcrumb">
      <template #extend>
        <v-flex class="kubegems__full-right">
          <v-btn
            text
            small
            class="primary--text"
            @click="resourceYaml"
          >
            <v-icon
              left
              small
            >
              fas fa-code
            </v-icon>
            Yaml
          </v-btn>
          <v-menu
            v-if="m_permisson_resourceAllow"
            left
          >
            <template #activator="{ on }">
              <v-btn icon>
                <v-icon
                  x-small
                  color="primary"
                  v-on="on"
                >
                  fas fa-ellipsis-v
                </v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-card-text class="pa-2">
                <v-flex>
                  <v-btn
                    color="primary"
                    text
                    small
                    @click="updateServiceMonitor"
                  >
                    编辑
                  </v-btn>
                </v-flex>
                <v-flex>
                  <v-btn
                    color="error"
                    text
                    small
                    @click="removeServiceMonitor"
                  >
                    删除
                  </v-btn>
                </v-flex>
              </v-card-text>
            </v-card>
          </v-menu>
        </v-flex>
      </template>
    </BaseBreadcrumb>
    <v-row class="mt-0">
      <v-col
        cols="2"
        class="pt-0"
      >
        <BasicResourceInfo :item="serviceMonitor" />
      </v-col>
      <v-col
        cols="10"
        class="pt-0"
      >
        <v-card flat>
          <v-card-text class="pa-0">
            <v-tabs
              v-model="tab"
              height="40"
              class="rounded-t pl-2 pt-2"
            >
              <v-tab
                v-for="item in tabItems"
                :key="item.value"
              >
                {{ item.text }}
              </v-tab>
            </v-tabs>

            <component
              :is="tabItems[tab].value"
              :ref="tabItems[tab].value"
              :item="serviceMonitor"
              :selector="selector"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <ResourceYaml
      ref="resourceYaml"
      :item="serviceMonitor"
    />
    <UpdateServiceMonitor
      ref="updateServiceMonitor"
      @refresh="serviceMonitorDetail"
    />
  </v-container>
</template>

<script>
import { mapState } from 'vuex'
import { getServiceMonitorDetail, deleteServiceMonitor } from '@/api'
import ResourceInfo from './components/ResourceInfo'
import Metadata from '@/views/resource/components/metadata/Metadata'
import EventList from '@/views/resource/components/common/EventList'
import ResourceYaml from '@/views/resource/components/common/ResourceYaml'
import BasicResourceInfo from '@/views/resource/components/common/BasicResourceInfo'
import UpdateServiceMonitor from './components/UpdateServiceMonitor'
import BaseResource from '@/mixins/resource'
import BasePermission from '@/mixins/permission'

export default {
  name: 'ServiceMonitorDetail',
  components: {
    ResourceInfo,
    Metadata,
    EventList,
    ResourceYaml,
    BasicResourceInfo,
    UpdateServiceMonitor,
  },
  mixins: [BaseResource, BasePermission],
  data: () => ({
    breadcrumb: {
      title: '采集器',
      tip: '采集器 (ServiceMonitor) 为一组服务定义监控, 自动被Prometheus发现, 成为其指标拉取目标Target。',
      icon: 'mdi-eyedropper',
    },
    serviceMonitor: null,
    tab: 0,
    tabItems: [
      { text: '资源信息', value: 'ResourceInfo' },
      { text: '元数据', value: 'Metadata' },
      { text: '事件', value: 'EventList' },
    ],
  }),
  computed: {
    ...mapState(['JWT']),
    selector() {
      if (this.tabItems[this.tab].value === 'EventList') {
        return {
          topkind: 'ServiceMonitor',
          topname: this.serviceMonitor ? this.serviceMonitor.metadata.name : '',
        }
      }
      return {}
    },
  },
  mounted() {
    if (this.JWT) {
      this.$nextTick(() => {
        this.serviceMonitorDetail()
      })
    }
  },
  methods: {
    async serviceMonitorDetail() {
      const data = await getServiceMonitorDetail(
        this.ThisCluster,
        this.$route.query.namespace,
        this.$route.params.name,
      )
      this.serviceMonitor = data
    },
    resourceYaml() {
      this.$refs.resourceYaml.open()
    },
    updateServiceMonitor() {
      this.$refs.updateServiceMonitor.init(this.serviceMonitor)
      this.$refs.updateServiceMonitor.open()
    },
    removeServiceMonitor() {
      const item = this.serviceMonitor
      this.$store.commit('SET_CONFIRM', {
        title: `删除采集器`,
        content: {
          text: `删除采集器 ${item.metadata.name}`,
          type: 'delete',
          name: item.metadata.name,
        },
        param: { item },
        doFunc: async (param) => {
          await deleteServiceMonitor(
            this.ThisCluster,
            this.$route.query.namespace,
            param.item.metadata.name,
          )
          this.$router.push({ name: 'servicemonitor-list' })
        },
      })
    },
  },
}
</script>
