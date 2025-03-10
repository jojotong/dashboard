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
                    @click="updateCertificate"
                  >
                    编辑
                  </v-btn>
                </v-flex>
                <v-flex>
                  <v-btn
                    color="error"
                    text
                    small
                    @click="removeCertificate"
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
        <BasicResourceInfo :item="certificate" />
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
              :item="certificate"
              :selector="selector"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <ResourceYaml
      ref="resourceYaml"
      :item="certificate"
    />
    <UpdateCertificate
      ref="updateCertificate"
      @refresh="certificateDetail"
    />
  </v-container>
</template>

<script>
import { mapState } from 'vuex'
import { getCertificateDetail, deleteCertificate } from '@/api'
import ResourceInfo from './components/ResourceInfo'
import Metadata from '@/views/resource/components/metadata/Metadata'
import EventList from '@/views/resource/components/common/EventList'
import ResourceYaml from '@/views/resource/components/common/ResourceYaml'
import BasicResourceInfo from '@/views/resource/components/common/BasicResourceInfo'
import UpdateCertificate from './components/UpdateCertificate'
import BaseResource from '@/mixins/resource'
import BasePermission from '@/mixins/permission'
import BaseFilter from '@/mixins/base_filter'

export default {
  name: 'CertificateDetail',
  components: {
    ResourceYaml,
    BasicResourceInfo,
    UpdateCertificate,
    ResourceInfo,
    Metadata,
    EventList,
  },
  mixins: [BaseFilter, BaseResource, BasePermission],
  data: () => ({
    breadcrumb: {
      title: '证书',
      tip: '证书 (Certificate)，在创建证书时，证书管理器将创建相应的CertificateRequest资源，其中包含编码的X.509证书请求、颁发者引用和基于证书资源规范的其他选项。',
      icon: 'mdi-book-open',
    },
    certificate: null,
    tab: 0,
    tabItems: [
      { text: '资源信息', value: 'ResourceInfo' },
      { text: '元数据', value: 'Metadata' },
      { text: '事件', value: 'EventList' },
    ],
  }),
  computed: {
    ...mapState(['JWT', 'AdminViewport']),
    selector() {
      if (this.tabItems[this.tab].value === 'EventList') {
        return {
          topkind: 'Certificate',
          topname: this.certificate ? this.certificate.metadata.name : '',
        }
      }
      return {}
    },
  },
  mounted() {
    if (this.JWT) {
      this.$nextTick(() => {
        this.certificateDetail()
      })
    }
  },
  methods: {
    async certificateDetail() {
      const data = await getCertificateDetail(
        this.ThisCluster,
        this.$route.query.namespace,
        this.$route.params.name,
      )
      this.certificate = data
    },
    resourceYaml() {
      this.$refs.resourceYaml.open()
    },
    updateCertificate() {
      this.$refs.updateCertificate.init(this.certificate)
      this.$refs.updateCertificate.open()
    },
    removeCertificate() {
      const item = this.certificate
      this.$store.commit('SET_CONFIRM', {
        title: `删除证书`,
        content: {
          text: `删除证书 ${item.metadata.name}`,
          type: 'delete',
          name: item.metadata.name,
        },
        param: { item },
        doFunc: async (param) => {
          await deleteCertificate(
            this.ThisCluster,
            this.$route.query.namespace,
            param.item.metadata.name,
          )
          this.$router.push({
            name: 'certificate-list',
          })
        },
      })
    },
  },
}
</script>
