<script lang="ts">
  type Tag = {
    id: string;
    name: string;
    icon?: string;
  };
  type TagType = 'primary'|'secondary'|'accent'|'neutral'|'info'|'success'|'warning'|'error';
  interface Props {
    tag: Tag;
    type?: TagType;
  }
  const { tag, type }: Props = $props();
  const badgeClasses: Record<TagType, string> = {
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    accent: 'badge-accent',
    neutral: 'badge-neutral',
    info: 'badge-info',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error'
  };
</script>

<div class="badge {type ? badgeClasses[type] : undefined}">
  {#if tag.icon}
    <div aria-label={tag.name} class="mr-2 mask size-4 bg-base-content" style={`mask-image: url('${tag.icon}')`}></div>
  {/if}
  {tag.name}
</div>
