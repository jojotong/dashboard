<template>
  <v-container fluid>
    <BaseMicroServiceHeader />
    <BaseBreadcrumb :breadcrumb="breadcrumb" />
    <v-card>
      <v-card-title class="py-2">
        <BaseFilter
          :filters="filters"
          :default="{ items: [], text: '服务入口名称', value: 'search' }"
          @refresh="m_filter_list"
        />
        <EnvironmentFilter />
        <v-spacer />
        <v-menu
          v-if="m_permisson_virtualSpaceAllow"
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
                  @click="addServiceEntry"
                >
                  <v-icon left>mdi-plus-box</v-icon>
                  创建服务入口
                </v-btn>
              </v-flex>
              <v-flex>
                <v-btn
                  text
                  color="error"
                  @click="
                    m_table_batchRemoveResource(
                      '服务入口',
                      'ServiceEntry',
                      istioServiceEntryList,
                    )
                  "
                >
                  <v-icon left>mdi-minus-box</v-icon>
                  删除服务入口
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
            color="primary"
            hide-details
            @click.stop
            @change="m_table_onResourceChange($event, item, index)"
          />
        </template>
        <template #[`item.name`]="{ item }">
          <a class="text-subtitle-2">
            {{ item.metadata.name }}
          </a>
        </template>
        <template #[`item.namespace`]="{ item }">
          {{ item.metadata.namespace }}
        </template>
        <template #[`item.hosts`]="{ item }">
          <BaseCollapseChips
            v-if="item"
            :chips="item.spec.hosts || []"
            single-line
            icon="mdi-directions-fork"
          />
        </template>
        <template #[`item.ports`]="{ item }">
          <BaseCollapseChips
            v-if="item"
            :chips="item.ports || []"
            single-line
            icon="mdi-directions-fork"
          />
        </template>
        <template #[`item.resolution`]="{ item }">
          {{ item.spec.resolution }}
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
              <v-card-text class="pa-2">
                <v-flex>
                  <v-btn
                    color="primary"
                    text
                    small
                    @click.stop="updateServiceEntry(item)"
                  >
                    编辑
                  </v-btn>
                </v-flex>
                <v-flex>
                  <v-btn
                    color="error"
                    text
                    small
                    @click.stop="removeIstioServiceEntry(item)"
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
        @loaddata="istioServiceEntryList"
        @changesize="onPageSizeChange"
        @changepage="onPageIndexChange"
      />
    </v-card>

    <AddServiceEntry
      ref="addServiceEntry"
      @refresh="istioServiceEntryList"
    />
    <UpdateServiceEntry
      ref="updateServiceEntry"
      @refresh="istioServiceEntryList"
    />
  </v-container>
</template>

<script>
import { mapState } from 'vuex'
import { getIstioServiceEntryList, deleteIstioServiceEntry } from '@/api'
import EnvironmentFilter from '@/views/microservice/components/EnvironmentFilter'
import AddServiceEntry from './components/AddServiceEntry'
import UpdateServiceEntry from './components/UpdateServiceEntry'
import BaseResource from '@/mixins/resource'
import BasePermission from '@/mixins/permission'
import BaseFilter from '@/mixins/base_filter'
import BaseTable from '@/mixins/table'
import { convertStrToNum } from '@/utils/helpers'

export default {
  name: 'ServiceEntry',
  components: {
    AddServiceEntry,
    UpdateServiceEntry,
    EnvironmentFilter,
  },
  mixins: [BaseFilter, BaseResource, BasePermission, BaseTable],
  data: () => ({
    breadcrumb: {
      title: '服务入口',
      tip: '服务入口 (ServiceEntry) 允许在 Istio 的内部服务注册表中添加额外的条目，以便网格中自动发现的服务可以访问/路由到这些手动指定的服务。',
      icon: 'mdi-login-variant',
    },
    items: [],
    pageCount: 0,
    params: {
      page: 1,
      size: 10,
    },
    filters: [{ text: '服务入口名称', value: 'search', items: [] }],
  }),
  computed: {
    ...mapState(['JWT', 'EnvironmentFilter']),
    headers() {
      const items = [
        { text: '服务入口名称', value: 'name', align: 'start' },
        {
          text: '命名空间',
          value: 'namespace',
          align: 'start',
          sortable: false,
        },
        { text: 'Host', value: 'hosts', align: 'start' },
        { text: '端口', value: 'ports', align: 'start' },
        { text: 'Resolution', value: 'resolution', align: 'start' },
        { text: '创建时间', value: 'createAt', align: 'start', width: 180 },
      ]
      if (this.m_permisson_virtualSpaceAllow) {
        items.push({
          text: '',
          value: 'action',
          align: 'center',
          width: 20,
          sortable: false,
        })
      }
      return items
    },
  },
  watch: {
    m_table_sortparam: {
      handler: function (newV, oldV) {
        if (oldV.name !== newV.name) return
        if (oldV.desc === null) return
        this.istioServiceEntryList(true)
      },
      deep: true,
    },
    '$store.state.EnvironmentFilter': {
      handler: function (env) {
        if (env) this.istioServiceEntryList()
      },
      deep: true,
      immediate: true,
    },
  },
  mounted() {
    if (this.JWT) {
      this.$nextTick(() => {
        Object.assign(this.params, convertStrToNum(this.$route.query))
      })
    }
  },
  methods: {
    async istioServiceEntryList(noprocess = false) {
      const data = await getIstioServiceEntryList(
        this.EnvironmentFilter.cluster,
        this.EnvironmentFilter.namespace,
        Object.assign(this.params, {
          noprocessing: noprocess,
          sort: this.m_table_generateResourceSortParamValue(),
        }),
      )
      this.items = data.List.map((s) => {
        return {
          ...s,
          ports: s.spec.ports
            ? s.spec.ports.map((port) => {
                return `${port.number} | ${port.protocol}`
              })
            : [],
        }
      })
      this.pageCount = Math.ceil(data.Total / this.params.size)
      this.params.page = data.CurrentPage
      this.m_table_generateSelectResource()
    },
    addServiceEntry() {
      this.$refs.addServiceEntry.open()
    },
    updateServiceEntry(item) {
      this.$refs.updateServiceEntry.init(item)
      this.$refs.updateServiceEntry.open()
    },
    removeIstioServiceEntry(item) {
      this.$store.commit('SET_CONFIRM', {
        title: `删除服务入口`,
        content: {
          text: `删除服务入口 ${item.metadata.name}`,
          type: 'delete',
          name: item.metadata.name,
        },
        param: { item },
        doFunc: async (param) => {
          if (param.item.metadata.name.length > 0) {
            await deleteIstioServiceEntry(
              this.$route.query.cluster,
              param.item.metadata.namespace,
              param.item.metadata.name,
            )
            this.istioServiceEntryList()
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
