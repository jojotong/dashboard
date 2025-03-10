<template>
  <v-flex class="pt-4">
    <v-menu
      v-model="menu"
      left
      :close-on-click="false"
      :close-on-content-click="false"
      eager
      content-class="resourceMenu"
    >
      <v-card>
        <v-card-text class="pa-2 text-center">
          <v-flex>
            <v-btn
              color="primary"
              text
              small
              @click="syncResource"
            >
              同步
            </v-btn>
          </v-flex>
          <v-flex>
            <v-btn
              color="error"
              text
              small
              @click="removeResource"
            >
              删除
            </v-btn>
          </v-flex>
        </v-card-text>
      </v-card>
    </v-menu>

    <VueOkrTree
      class="resource-tree"
      direction="horizontal"
      :data="tree"
      :render-content="renderContent"
      current-lable-class-name="crrent-active-class"
      :style="`height: ${height}px`"
      @node-click="showDeployLive"
    />

    <DeployLive ref="deployLive" />
  </v-flex>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import {
  getAppRunningResourceDetail,
  postSyncAppResource,
  deleteAppResource,
} from '@/api'
import DeployLive from './DeployLive'
import BaseResource from '@/mixins/resource'

export default {
  name: 'DeployTopology',
  components: {
    DeployLive,
  },
  mixins: [BaseResource],
  props: {
    app: {
      type: Object,
      default: () => null,
    },
    appname: {
      type: String,
      default: () => '',
    },
    tree: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      menu: true,
      data: {},
    }
  },
  computed: {
    height() {
      return window.innerHeight - 265
    },
    ...mapState(['Scale']),
    ...mapGetters(['Tenant', 'Project', 'Environment']),
  },
  watch: {
    tree: {
      handler() {
        if (this.tree[0].conditions && this.tree[0].conditions.length > 0) {
          const interval = setInterval(() => {
            const eles = document.getElementsByClassName(
              'org-chart-node-label-inner',
            )
            if (eles && eles.length > 0) {
              const ele = eles[0]
              ele.style.backgroundColor = '#FFEBEE'
              clearInterval(interval)
            }
          }, 500)
        }
      },
      deep: true,
    },
  },
  mounted() {
    this.$nextTick(() => {
      const menus = document.getElementsByClassName('resourceMenu')
      if (menus && menus.length > 0) {
        const menu = menus[0]
        menu.style.visibility = 'hidden'
      }
    })
  },
  methods: {
    showDeployLive(data) {
      this.appRunningResourceDetail(data)
    },
    async appRunningResourceDetail(gvk) {
      const data = await getAppRunningResourceDetail(
        this.Tenant().ID,
        this.Project().ID,
        this.Environment().ID,
        this.appname,
        {
          group: gvk.group ? gvk.group : '',
          version: gvk.version,
          kind: gvk.kind,
          namespace: gvk.namespace,
          name: gvk.name,
        },
      )
      this.$refs.deployLive.init(data)
      this.$refs.deployLive.open()
    },
    getIcon(kind) {
      /* eslint-disable jsx-quotes */
      const div = (
        <div class="float-left img">
          <div class="v-menu__content manuable__content__active imgtip">
            <div class="v-card v-sheet theme--light text-center">
              <div class="v-card__text pa-2">{kind}</div>
            </div>
          </div>
          <img width="70px" height="70px" src="/icon/kubernetes/app.svg">
            {kind}
          </img>
        </div>
      )
      const img = div.children[1]
      if (kind !== 'Application') {
        img.data.attrs.src = `/icon/kubernetes/${
          this.$K8S_RESOURCE_ICON[kind] || 'cr'
        }.svg`
      }
      return div
    },
    showMenu(e) {
      e.stopPropagation()
      const menus = document.getElementsByClassName('resourceMenu')
      if (menus && menus.length > 0) {
        const menu = menus[0]
        const scrollTop =
          document.body.scrollTop || document.documentElement.scrollTop
        menu.style.left = e.x / this.Scale + 5 / this.Scale + 'px'
        menu.style.top = e.y + scrollTop / this.Scale + 30 / this.Scale + 'px'
        this.data = JSON.parse(e.target.dataset['data'])
        menu.style.visibility = 'visible'
      }
    },
    hideMenu() {
      const timeout = window.setTimeout(() => {
        const menus = document.getElementsByClassName('resourceMenu')
        if (menus && menus.length > 0) {
          const menu = menus[0]
          menu.style.visibility = 'hidden'
          clearTimeout(timeout)
        }
      }, 100)
    },
    syncResource() {
      this.$store.commit('SET_CONFIRM', {
        title: '同步资源',
        content: {
          text: `同步资源 ${this.data.kind}/${this.data.name}，该操作会导致服务重启`,
          type: 'confirm',
        },
        param: {},
        doFunc: async () => {
          await postSyncAppResource(
            this.app.TenantID,
            this.app.ProjectID,
            this.ThisAppEnvironmentID,
            this.app.name,
            {
              resources: [
                {
                  group: this.data.group ? this.data.group : '',
                  kind: this.data.kind,
                  version: this.data.version,
                  namespace: this.data.namespace,
                  name: this.data.name,
                },
              ],
            },
          )
          this.$emit('refresh')
        },
      })
    },
    removeResource() {
      this.$store.commit('SET_CONFIRM', {
        title: '删除资源',
        content: {
          text: `删除资源 ${this.data.kind}/${this.data.name}`,
          type: 'delete',
          name: this.data.name,
        },
        param: {},
        doFunc: async () => {
          await deleteAppResource(
            this.app.TenantID,
            this.app.ProjectID,
            this.ThisAppEnvironmentID,
            this.app.name,
            {
              group: this.data.group ? this.data.group : '',
              kind: this.data.kind,
              version: this.data.version,
              namespace: this.data.namespace,
              name: this.data.name,
            },
          )
          this.$emit('refresh')
        },
      })
    },
    renderContent(h, node) {
      /* eslint-disable jsx-quotes */
      return (
        <div class="block-height">
          {this.getIcon(node.data.kind)}
          <div class="rounded max-width float-left font-weight-medium">
            <div class="content">
              <div class="flex-center">
                {node.data.sync === 'Synced' ? (
                  <span class="v-icon notranslate mdi mdi-check-circle theme--light success--text mx-1 tree-status"></span>
                ) : node.data.sync === 'OutOfSync' ? (
                  node.data.syncState === 'Running' ? (
                    <span>
                      <span class="v-icon notranslate mdi mdi-autorenew theme--light orange--text mx-1 tree-status kubegems__waiting-circle-flashing"></span>
                      <span class="v-icon notranslate mdi mdi-arrow-up-bold-circle theme--light orange--text mx-1 tree-status"></span>
                    </span>
                  ) : (
                    <span class="v-icon notranslate mdi mdi-arrow-up-bold-circle theme--light orange--text mx-1 tree-status"></span>
                  )
                ) : node.data.syncState === 'Running' ? (
                  <span class="v-icon notranslate mdi mdi-autorenew theme--light orange--text mx-1 tree-status kubegems__waiting-circle-flashing"></span>
                ) : (
                  <span></span>
                )}
                {node.data.health ? (
                  node.data.health.status === 'Healthy' ? (
                    <span class="v-icon notranslate mdi mdi-heart-pulse theme--light success--text mx-1 tree-status"></span>
                  ) : node.data.health.status === 'Progressing' ? (
                    <span class="v-icon notranslate mdi mdi-heart theme--light mx-1 tree-status  run-flashing"></span>
                  ) : ['Suspended', 'Degraded', 'Missing'].indexOf(
                      node.data.health.status,
                    ) > -1 ? (
                    <span class="v-icon notranslate mdi mdi-heart-broken theme--light warning--text mx-1 tree-status"></span>
                  ) : (
                    <span class="v-icon notranslate mdi mdi-heart-broken theme--light error--text mx-1 tree-status"></span>
                  )
                ) : (
                  <span></span>
                )}
                <span class="resource">
                  <div class="v-menu__content theme--light manuable__content__active resourcetip">
                    <div class="v-card v-sheet theme--light text-center">
                      <div class="v-card__text pa-2">{node.data.name}</div>
                    </div>
                  </div>
                  <span class="kubegems__detail font-weight-medium">
                    {node.data.name}
                  </span>
                </span>
              </div>
              <button
                type="button"
                class="v-icon notranslate v-icon--link fas fa-ellipsis-v theme--light primary--text resource-operate"
                onclick={this.showMenu}
                onblur={this.hideMenu}
                data-data={JSON.stringify(node.data)}
              ></button>
            </div>
            <hr class="v-divider theme--light divider py-0 my-0" />
            <div class="datetime">
              {node.data.conditions && node.data.conditions.length > 0 ? (
                <span class="message">
                  <div class="v-menu__content manuable__content__active messagetip">
                    <div class="v-card v-sheet theme--light text-center">
                      <div class="v-card__text pa-2">
                        {node.data.conditions
                          .map((c) => {
                            return c.message
                          })
                          .join(',')}
                      </div>
                    </div>
                  </div>
                  <span class="kubegems__detail font-weight-medium">
                    {node.data.createdAt
                      ? this.$moment(
                          node.data.createdAt,
                          'YYYY-MM-DDTHH:mm:ssZ',
                        ).fromNow()
                      : ''}
                  </span>
                </span>
              ) : (
                <span class="kubegems__detail font-weight-medium">
                  {node.data.createdAt
                    ? this.$moment(
                        node.data.createdAt,
                        'YYYY-MM-DDTHH:mm:ssZ',
                      ).fromNow()
                    : ''}
                </span>
              )}
            </div>
          </div>
          <div class="kubegems__clear-float"></div>
        </div>
      )
    },
  },
}
</script>

<style lang="scss">
.resource-tree {
  overflow-y: auto;
  overflow-x: auto;
  min-height: 548px;
}
.crrent-active-class {
  color: #1e88e5;
}
.tree-label {
  font-size: 14px;
  line-height: 14px;
  min-width: 240px;
  max-width: 240px;
  margin: 0 auto;
}
.tree-status {
  font-size: 22px !important;
}
.horizontal .org-chart-node:not(.is-left-child-node)::before {
  margin-top: 1px;
}
.datetime {
  height: 35px;
  line-height: 35px;
  font-size: 14px;
}
.max-width {
  min-width: 190px;
  max-width: 190px;
  display: inline !important;
  height: 70px;
  line-height: 70px;
}
.content {
  height: 35px;
  line-height: 35px;
  display: flex !important;
  justify-content: center;
}
.divider {
  margin: 5px;
}
.run-flashing {
  animation-name: animate-flash;
  animation-duration: 1s;
  animation-timing-function: linear;
  animation-delay: 0s;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

@keyframes animate-flash {
  from {
    color: #00bcd4;
  }
  to {
    color: white;
  }
}
.block-height {
  height: 70px;
}
.display-none {
  display: none !important;
}
.imgtip {
  position: absolute;
  top: 12px;
  left: 85px;
  display: none !important;
  z-index: 15;
}
.resourcetip {
  position: absolute;
  top: 11px;
  left: 85px;
  display: none !important;
  z-index: 15;
  min-width: 200px;
}
.messagetip {
  position: absolute;
  top: 0;
  left: 100px;
  display: none !important;
  z-index: 15;
  min-width: 1000px;
}
.img:hover div {
  display: block !important;
}
.resource:hover div {
  display: block !important;
}
.datetime:hover div {
  display: block !important;
}
.is-root-label {
  padding-left: 10px !important;
}
.org-chart-node-label-inner {
  height: 80px !important;
  padding: 5px 8px !important;
  border-radius: 3px;
  box-shadow: 0 0 1px 0 rgb(27 19 19 / 10%);
}
.resource {
  text-overflow: ellipsis;
  overflow: hidden;
}
.resource-operate {
  font-size: 12px !important;
  width: 20px;
  height: 20px;
  margin-top: 7px;
}
.flex-center {
  flex: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
