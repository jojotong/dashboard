<template>
  <v-flex
    :class="`clear-zoom-${Scale.toString().replaceAll('.', '-')}`"
    :style="`height: ${height}px !important;overflow: auto;`"
  >
    <CodeDiff
      :old-string="normalizedLiveState"
      :new-string="predictedLiveState"
    />
  </v-flex>
</template>

<script>
import { mapState } from 'vuex'

import CodeDiff from 'vue-code-diff'

export default {
  name: 'DeployDiffYaml',
  components: { CodeDiff },
  props: {
    resource: {
      type: Object,
      default: () => null,
    },
  },
  data: () => ({
    normalizedLiveState: '',
    predictedLiveState: '',
  }),
  computed: {
    ...mapState(['Scale']),
    height() {
      return window.innerHeight - 64 * this.Scale - 1 - 40 * this.Scale
    },
  },
  watch: {
    resource: {
      handler: function () {
        if (this.resource) {
          this.normalizedLiveState = this.$yamldump(
            this.resource.normalizedLiveState,
          )
          this.predictedLiveState = this.$yamldump(
            this.resource.predictedLiveState,
          )
        }
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    // eslint-disable-next-line vue/no-unused-properties
    dispose() {},
  },
}
</script>

<style lang="scss">
.theme--light.v-application code {
  background-color: rgba(0, 0, 0, 0) !important;
  color: currentColor;
  font-size: 12px;
  line-height: 12px !important;
  font-family: Monaco, Menlo, Consolas, Courier New, monospace;
}

.hljs {
  height: 16px !important;
}

.d2h-code-line {
  font-size: 13px !important;
}

.d2h-diff-tbody {
  overflow: auto !important;
}
</style>
