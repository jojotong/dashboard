<template>
  <v-sheet
    :height="height"
    :class="`py-1 pl-2 text-subtitle-1 primary--text rounded-t ${color}`"
  >
    <span
      :class="`float-left subtitle font-weight-regular ${
        color === 'primary' ? 'white--text' : 'blue-grey--text text--darken-2'
      }`"
      style="line-height: 28px;"
    >
      {{ title }}
    </span>
    <span class="float-left text-body-2 subtitle-line-height">
      <slot name="tips"></slot>
    </span>
    <span class="float-left ml-4 text-body-2 subtitle-line-height">
      <slot name="header"></slot>
    </span>
    <span class="float-right">
      <slot name="action"></slot>
    </span>
    <span class="float-right mr-1">
      <slot name="selector"></slot>
    </span>
    <div class="subtitle-clear"></div>
    <v-divider v-if="divider" class="mr-2" />
  </v-sheet>
</template>

<script>
export default {
  name: 'BaseSubTitle',
  props: {
    title: {
      type: String,
      default: () => '',
    },
    height: {
      type: String,
      default: () => '36px',
    },
    divider: {
      type: Boolean,
      default: () => true,
    },
    color: {
      type: String,
      default: () => '',
    },
  },
}
</script>

<style lang="scss" scoped>
.subtitle-clear {
  clear: both;
}
.subtitle-line-height {
  line-height: 28px !important;
}
</style>
