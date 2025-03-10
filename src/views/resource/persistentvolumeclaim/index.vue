<template>
  <v-container fluid>
    <BaseViewportHeader />
    <BaseBreadcrumb :breadcrumb="breadcrumb" />
    <v-card>
      <v-card-title class="py-2">
        <BaseFilter
          :filters="filters"
          :default="{ items: [], text: '存储卷名称', value: 'search' }"
          @refresh="m_filter_list"
        />
        <NamespaceFilter />
        <v-spacer />
        <v-spacer />
        <v-menu
          v-if="m_permisson_resourceAllow"
          left
        >
          <template #activator="{ on }">
            <v-btn icon>
              <v-icon
                small
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
                  text
                  color="primary"
                  @click="addPersistentVolumeClaim"
                >
                  <v-icon left>mdi-database-plus</v-icon>
                  创建存储卷
                </v-btn>
              </v-flex>
              <v-flex>
                <v-btn
                  text
                  color="error"
                  @click="
                    m_table_batchRemoveResource(
                      '存储卷',
                      'PersistentVolumeClaim',
                      persistentVolumeClaimList,
                    )
                  "
                >
                  <v-icon left>mdi-minus-box</v-icon>
                  删除存储卷
                </v-btn>
              </v-flex>
            </v-card-text>
          </v-card>
        </v-menu>
      </v-card-title>
      <v-data-table
        class="mx-4"
        :headers="headers"
        :items="items"
        :page.sync="params.page"
        :items-per-page="params.size"
        no-data-text="暂无数据"
        hide-default-footer
        show-select
        @update:sort-by="m_table_sortBy"
        @update:sort-desc="m_table_sortDesc"
        @toggle-select-all="m_table_onResourceToggleSelect"
      >
        <template #[`item.data-table-select`]="{ item, index }">
          <v-checkbox
            v-model="
              m_table_batchResources[`${item.metadata.name}-${index}`].checked
            "
            hide-details
            color="primary"
            @click.stop
            @change="m_table_onResourceChange($event, item, index)"
          />
        </template>
        <template #[`item.name`]="{ item }">
          <a
            class="text-subtitle-2"
            @click="persistentVolumeClaimDetail(item)"
          >
            {{ item.metadata.name }}
          </a>
        </template>
        <template #[`item.namespace`]="{ item }">
          {{ item.metadata.namespace }}
        </template>
        <template #[`item.type`]="{ item }">
          {{ item.spec.storageClassName }}
        </template>
        <template #[`item.status`]="{ item }">
          {{
            item.metadata.deletionTimestamp ? 'Terminating' : item.status.phase
          }}
        </template>
        <template #[`item.mount`]="{ item }">
          <span
            :class="`v-avatar mr-2`"
            :style="`height: 10px; min-width: 10px; width: 10px; background-color: ${
              $PVC_STATUS_COLOR[
                item.metadata.annotations
                  ? item.metadata.annotations[`storage.${$DOMAIN}/in-use`]
                  : 'undefined'
              ]
            };`"
          />
          <span
            v-if="
              !(
                item.metadata.annotations &&
                item.metadata.annotations[`storage.${$DOMAIN}/in-use`]
              )
            "
          >
            未知
          </span>
          <span
            v-else-if="
              item.metadata.annotations &&
                item.metadata.annotations[`storage.${$DOMAIN}/in-use`] === 'true'
            "
          >
            已挂载
          </span>
          <span v-else> 未挂载 </span>
        </template>
        <template #[`item.accessMode`]="{ item }">
          {{ item.spec.accessModes[0] }}
        </template>
        <template #[`item.storage`]="{ item }">
          {{ item.spec.resources.requests.storage }}
        </template>
        <template #[`item.createAt`]="{ item }">
          {{
            item.metadata.creationTimestamp
              ? $moment(item.metadata.creationTimestamp).format('lll')
              : ''
          }}
        </template>
        <template #[`item.action`]="{ item }">
          <v-flex :id="`r${item.metadata.resourceVersion}`" />
          <v-menu
            left
            :attach="`#r${item.metadata.resourceVersion}`"
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
              <v-card-text class="pa-2 text-center">
                <v-flex>
                  <v-btn
                    color="primary"
                    text
                    small
                    @click="updatePersistentVolumeClaim(item)"
                  >
                    编辑
                  </v-btn>
                </v-flex>
                <v-flex>
                  <v-btn
                    color="primary"
                    text
                    small
                    @click="scalePersistentVolumeClaim(item)"
                  >
                    扩容
                  </v-btn>
                </v-flex>
                <v-flex
                  v-if="
                    item.metadata.annotations &&
                      item.metadata.annotations[
                        `storage.${$DOMAIN}/allow-snapshot`
                      ] &&
                      item.metadata.annotations[
                        `storage.${$DOMAIN}/allow-snapshot`
                      ] === 'true'
                  "
                >
                  <v-btn
                    color="primary"
                    text
                    small
                    @click="addVolumeSnapshot(item)"
                  >
                    创建快照
                  </v-btn>
                </v-flex>
                <v-flex>
                  <v-btn
                    color="error"
                    text
                    small
                    @click="removePersistentVolumeClaim(item)"
                  >
                    删除
                  </v-btn>
                </v-flex>
              </v-card-text>
            </v-card>
          </v-menu>
        </template>
      </v-data-table>
      <BasePagination
        v-if="pageCount >= 1"
        v-model="params.page"
        :page-count="pageCount"
        :size="params.size"
        @loaddata="persistentVolumeClaimList"
        @changesize="onPageSizeChange"
        @changepage="onPageIndexChange"
      />
    </v-card>

    <AddPersistentVolumeClaim
      ref="addPersistentVolumeClaim"
      @refresh="persistentVolumeClaimList"
    />
    <UpdatePersistentVolumeClaim
      ref="updatePersistentVolumeClaim"
      @refresh="persistentVolumeClaimList"
    />
    <ScalePersistentVolumeClaim
      ref="scalePersistentVolumeClaim"
      @refresh="persistentVolumeClaimList"
    />
  </v-container>
</template>

<script>
import { mapState } from 'vuex'
import {
  getPersistentVolumeClaimList,
  deletePersistentVolumeClaim,
  postAddVolumeSnapshot,
} from '@/api'
import NamespaceFilter from '@/views/resource/components/common/NamespaceFilter'
import ScalePersistentVolumeClaim from './components/ScalePersistentVolumeClaim'
import AddPersistentVolumeClaim from './components/AddPersistentVolumeClaim'
import UpdatePersistentVolumeClaim from './components/UpdatePersistentVolumeClaim'
import BaseResource from '@/mixins/resource'
import BasePermission from '@/mixins/permission'
import BaseFilter from '@/mixins/base_filter'
import BaseTable from '@/mixins/table'

export default {
  name: 'PersistentVolumeClaim',
  components: {
    AddPersistentVolumeClaim,
    UpdatePersistentVolumeClaim,
    NamespaceFilter,
    ScalePersistentVolumeClaim,
  },
  mixins: [BaseFilter, BaseResource, BasePermission, BaseTable],
  data: () => ({
    breadcrumb: {
      title: '存储卷',
      tip: '存储卷(persistentVolumeClaim)供用户创建的工作负载使用，是将工作负载数据持久化的一种资源对象。',
      icon: 'mdi-database',
    },
    items: [],
    pageCount: 0,
    params: {
      page: 1,
      size: 10,
    },
    filters: [{ text: '存储卷名称', value: 'search', items: [] }],
  }),
  computed: {
    ...mapState(['JWT', 'AdminViewport']),
    headers() {
      const items = [
        { text: '存储卷', value: 'name', align: 'start' },
        { text: '类型', value: 'type', align: 'start', sortable: false },
        { text: '状态', value: 'status', align: 'start', sortable: false },
        {
          text: '访问模式',
          value: 'accessMode',
          align: 'start',
          sortable: false,
        },
        { text: '容量', value: 'storage', align: 'start', sortable: false },
        { text: '挂载', value: 'mount', align: 'start', sortable: false },
        { text: '创建时间', value: 'createAt', align: 'start' },
      ]
      if (this.m_permisson_resourceAllow) {
        items.push({
          text: '',
          value: 'action',
          align: 'center',
          width: 20,
          sortable: false,
        })
      }
      if (this.AdminViewport) {
        items.splice(1, 0, {
          text: '命名空间',
          value: 'namespace',
          align: 'start',
          sortable: false,
        })
      }
      return items
    },
  },
  watch: {
    '$store.state.NamespaceFilter': {
      handler: function (namespace) {
        if (namespace && !namespace.Mounted) {
          this.params.page = 1
          this.params.namespace = namespace.Namespace
          this.persistentVolumeClaimList()
        }
      },
      deep: true,
    },
    m_table_sortparam: {
      handler: function (newV, oldV) {
        if (oldV.name !== newV.name) return
        if (oldV.desc === null) return
        this.persistentVolumeClaimList(true)
      },
      deep: true,
    },
  },
  mounted() {
    if (this.JWT) {
      this.$nextTick(() => {
        if (this.ThisCluster === '') {
          this.$store.commit('SET_SNACKBAR', {
            text: `请创建或选择集群`,
            color: 'warning',
          })
          return
        }
        this.m_table_generateParams()
        this.persistentVolumeClaimList()
      })
    }
  },
  methods: {
    async persistentVolumeClaimList(noprocess = false) {
      const data = await getPersistentVolumeClaimList(
        this.ThisCluster,
        this.ThisNamespace,
        Object.assign(this.params, {
          noprocessing: noprocess,
          sort: this.m_table_generateResourceSortParamValue(),
        }),
      )
      this.items = data.List
      this.pageCount = Math.ceil(data.Total / this.params.size)
      this.params.page = data.CurrentPage
      this.$router.replace({ query: { ...this.$route.query, ...this.params } })
      this.m_table_generateSelectResource()
    },
    persistentVolumeClaimDetail(item) {
      this.$router.push({
        name: 'persistentvolumeclaim-detail',
        params: {
          name: item.metadata.name,
        },
        query: {
          namespace: item.metadata.namespace,
        },
      })
    },
    addPersistentVolumeClaim() {
      this.$refs.addPersistentVolumeClaim.open()
    },
    updatePersistentVolumeClaim(item) {
      this.$refs.updatePersistentVolumeClaim.init(item)
      this.$refs.updatePersistentVolumeClaim.open()
    },
    addVolumeSnapshot(item) {
      this.$store.commit('SET_CONFIRM', {
        title: `创建存储卷快照`,
        content: {
          text: `创建存储卷快照 ${item.metadata.name}`,
          type: 'confirm',
        },
        param: { item },
        doFunc: async (param) => {
          if (param.item.metadata.name.length > 0) {
            await postAddVolumeSnapshot(
              this.ThisCluster,
              param.item.metadata.namespace,
              {
                persistentVolumeClaimName: param.item.metadata.name,
              },
            )
          }
        },
      })
    },
    scalePersistentVolumeClaim(item) {
      this.$refs.scalePersistentVolumeClaim.init(item)
      this.$refs.scalePersistentVolumeClaim.open()
    },
    removePersistentVolumeClaim(item) {
      this.$store.commit('SET_CONFIRM', {
        title: `删除存储卷`,
        content: {
          text: `删除存储卷 ${item.metadata.name}`,
          type: 'delete',
          name: item.metadata.name,
        },
        param: { item },
        doFunc: async (param) => {
          if (param.item.metadata.name.length > 0) {
            await deletePersistentVolumeClaim(
              this.ThisCluster,
              param.item.metadata.namespace,
              param.item.metadata.name,
            )
            this.persistentVolumeClaimList()
          }
        },
      })
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
