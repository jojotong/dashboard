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
                    color="error"
                    text
                    small
                    @click="removeCRD"
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
        <BasicResourceInfo
          :item="crd"
          :project="false"
          :environment="false"
        />
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
              :item="crd"
              :selector="{
                topkind: 'CustomResourceDefinition',
                topname: crd ? crd.metadata.name : '',
              }"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <ResourceYaml
      ref="resourceYaml"
      :item="crd"
    />
  </v-container>
</template>

<script>
import { mapState } from 'vuex'
import { getCrdDetail, deleteCRD } from '@/api'
import ResourceInfo from './components/ResourceInfo'
import Metadata from '@/views/resource/components/metadata/Metadata'
import CRList from './components/CRList'
import ResourceYaml from '@/views/resource/components/common/ResourceYaml'
import BasicResourceInfo from '@/views/resource/components/common/BasicResourceInfo'
import BaseResource from '@/mixins/resource'
import BasePermission from '@/mixins/permission'

export default {
  name: 'CRDDetail',
  components: {
    ResourceInfo,
    Metadata,
    ResourceYaml,
    BasicResourceInfo,
    CRList,
  },
  mixins: [BaseResource, BasePermission],
  data: () => ({
    breadcrumb: {
      title: 'CRD',
      tip: '自定义资源 (CRD) 是一种 Kubernetes 实现自定义资源类型的扩展方式，用户可以如同操作内置资源对象一样操作 CRD 对象。',
      icon: 'mdi-collage',
    },
    crd: null,
    tab: 0,
    tabItems: [
      { text: '资源信息', value: 'ResourceInfo' },
      { text: '元数据', value: 'Metadata' },
      { text: '资源列表', value: 'CRList' },
    ],
  }),
  computed: {
    ...mapState(['JWT']),
  },
  mounted() {
    if (this.JWT) {
      this.$nextTick(() => {
        this.crdDetail()
      })
    }
  },
  methods: {
    async crdDetail() {
      const data = await getCrdDetail(this.ThisCluster, this.$route.params.name)
      this.crd = data
    },
    resourceYaml() {
      this.$refs.resourceYaml.open()
    },
    removeCRD() {
      const item = this.crd
      this.$store.commit('SET_CONFIRM', {
        title: `删除CRD`,
        content: {
          text: `删除CRD ${item.metadata.name}`,
          type: 'delete',
          name: item.metadata.name,
        },
        param: { item },
        doFunc: async (param) => {
          await deleteCRD(this.ThisCluster, param.item.metadata.name)
          this.$router.push({ name: 'crd-list' })
        },
      })
    },
  },
}
</script>
