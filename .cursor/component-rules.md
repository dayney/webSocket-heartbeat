// Vue 组件规范

/\*\*

- 直接引用原则
-
- 问题: 避免在 Vue 组件中创建不必要的计算属性进行简单数据传递
-
- 正确做法: 除非需要对数据进行转换、增强或格式化处理，否则应直接使用原始响应式数据，
- 避免创建不必要的计算属性进行简单传递。
-
- 例如：
-
- 不推荐:
- const currentMemberWithAvatar = computed(() => currentMember.value);
- const currentBodyMetrics = computed(() => currentMember.value.bodyMetrics);
- <UserProfile :user="currentMemberWithAvatar" />
- <BodyMetrics :metrics="currentBodyMetrics" />
-
- 推荐:
- <UserProfile :user="currentMember.value" />
- <BodyMetrics :metrics="currentMember.value.bodyMetrics" />
-
- 允许的情况:
- - 需要进行数据转换或格式化
- - 需要添加派生属性
- - 需要合并多个数据源
- - 需要添加默认值或空值处理
    \*/

/\*\*

- Vue 3 模板自动解包规则
-
- 问题: 在 Vue 3 中使用 Composition API 时，经常出现模板中错误地使用`.value`来访问响应式引用(ref)的情况，
- 导致代码不一致且可能引发错误。
-
- 正确做法: 在 Vue 3 中，模板会自动解包响应式引用(ref)，所以在模板中直接使用变量名而不需要`.value`。
-
- 具体说明:
- 从`storeToRefs`或`ref`获取的响应式引用有两种不同的访问方式：
- - 在 JavaScript 代码中：必须使用`.value`访问值
- - 在模板中：自动解包，不使用`.value`
-
- 错误示例:
- <!-- 错误 - 在模板中使用.value -->
- <div>{{ user.value.name }}</div>
- <div v-for="item in list.value">{{ item }}</div>
-
- 正确示例:
- <!-- 正确 - 在模板中不使用.value -->
- <div>{{ user.name }}</div>
- <div v-for="item in list">{{ item }}</div>
-
- JavaScript 中的正确用法:
- // 在 JS 代码中必须使用.value
- console.log(user.value.name);
- const items = list.value.filter(item => item.active);
-
- 为什么重要:
- - 保持代码一致性
- - 避免模板渲染错误（如试图访问 undefined 的属性）
- - 遵循 Vue 3 的设计原则和最佳实践
- - 提高代码可读性和可维护性
    \*/

# Vue 组件开发规范

## 1. 就近原则

- 状态和方法应该定义在它们实际使用的功能模块前面
- 相关的状态和方法应该放在一起定义
- 避免将所有状态集中在组件顶部

示例：

```vue
// 不推荐 const count = ref(0) const name = ref('') const age = ref(0) const increment = () =>
count.value++ const updateName = (newName) => name.value = newName const updateAge = (newAge) =>
age.value = newAge // 推荐 // 计数器相关 const count = ref(0) const increment = () => count.value++
// 用户信息相关 const name = ref('') const age = ref(0) const updateName = (newName) => name.value =
newName const updateAge = (newAge) => age.value = newAge
```

## 2. Props 规范

- 必须指定类型和默认值
- 使用 TypeScript 时应该使用接口定义 props 类型
- 避免直接修改 props，应该通过 emit 事件通知父组件修改

示例：

```vue
// 不推荐 const props = defineProps(['title', 'count']) // 推荐 const props = defineProps({ title: {
type: String, required: true }, count: { type: Number, default: 0 } })
```

## 3. 响应式引用使用规范

- 在模板中不要使用 .value
- 在 JavaScript 代码中必须使用 .value
- 使用 storeToRefs 解构 store 中的状态

示例：

```vue
// 不推荐
<template>
  <div>{{ user.value.name }}</div>
</template>

// 推荐
<template>
  <div>{{ user.name }}</div>
</template>

<script setup>
const user = ref({ name: 'John' })
console.log(user.value.name) // 在 JS 中使用 .value
</script>
```

## 4. 计算属性使用规范

- 避免创建不必要的计算属性
- 只在需要数据转换、格式化或合并多个数据源时使用计算属性
- 计算属性应该是纯函数，不包含副作用

示例：

```vue
// 不推荐 const fullName = computed(() => user.value.name) // 推荐 const fullName = computed(() => {
return `${user.value.firstName} ${user.value.lastName}` })
```

## 5. 异步操作规范

- 必须使用 try/catch 进行错误处理
- 使用 async/await 处理异步操作
- 在组件卸载时取消未完成的异步操作

示例：

```vue
const fetchData = async () => { try { const response = await api.getData() data.value =
response.data } catch (error) { console.error('获取数据失败:', error) // 错误处理逻辑 } }
```

## 6. 列表渲染规范

- 必须指定唯一的 key 属性
- 避免使用索引作为 key
- 使用 v-for 时应该指定类型

示例：

```vue
// 不推荐
<div v-for="(item, index) in items" :key="index">
  {{ item.name }}
</div>

// 推荐
<div v-for="item in items" :key="item.id">
  {{ item.name }}
</div>
```

</rewritten_file>
