# Custom Select Component Documentation

## Overview
Custom select/listbox components with glassmorphism design matching the QuizGod website aesthetic.

## Features
- ✨ Glassmorphism design with backdrop blur
- 🎨 Multiple color variants (cyan, violet, emerald, orange, pink)
- 🎭 Smooth animations and transitions
- 📱 Fully responsive
- ♿ Accessible with proper focus states
- 🎯 Custom dropdown arrow with gradient effects
- 💫 Glow effects on hover and focus
- 🔧 TypeScript support

## Basic Usage

### Standard Select
```tsx
import CustomSelect from '@/components/CustomSelect';

<CustomSelect
  label="Choose an option"
  value={selectedValue}
  onChange={(e) => setSelectedValue(e.target.value)}
>
  <option value="">Select one...</option>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</CustomSelect>
```

### Subject Select
```tsx
import { SubjectSelect } from '@/components/CustomSelect';

<SubjectSelect
  value={subject}
  onChange={(e) => setSubject(e.target.value)}
>
  <option value="">Select subject</option>
  {subjects.map(s => (
    <option key={s.id} value={s.name}>{s.name}</option>
  ))}
</SubjectSelect>
```

### Class Select
```tsx
import { ClassSelect } from '@/components/CustomSelect';

<ClassSelect
  value={selectedClass}
  onChange={(e) => setSelectedClass(e.target.value)}
>
  <option value="">No class</option>
  {classes.map(c => (
    <option key={c.id} value={c.id}>{c.name}</option>
  ))}
</ClassSelect>
```

### Filter Select
```tsx
import { FilterSelect } from '@/components/CustomSelect';

<FilterSelect
  label="Filter by"
  value={filter}
  onChange={(e) => setFilter(e.target.value)}
>
  <option value="">All</option>
  <option value="active">Active</option>
  <option value="archived">Archived</option>
</FilterSelect>
```

## Props

### CustomSelect Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text displayed above select |
| `error` | `string` | - | Error message displayed below select |
| `variant` | `'cyan' \| 'violet' \| 'emerald' \| 'orange' \| 'pink'` | `'cyan'` | Color theme variant |
| `fullWidth` | `boolean` | `true` | Whether select takes full width |
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | - | Option elements |
| ...rest | `SelectHTMLAttributes` | - | All standard select attributes |

## Color Variants

### Cyan (Default)
Used for general selections, subjects
- Focus ring: `cyan-400`
- Border glow: `cyan-400/50`

### Violet
Used for class selections, categories
- Focus ring: `violet-400`
- Border glow: `violet-400/50`

### Emerald
Used for filters, status selections
- Focus ring: `emerald-400`
- Border glow: `emerald-400/50`

### Orange
Used for priority, importance selections
- Focus ring: `orange-400`
- Border glow: `orange-400/50`

### Pink
Used for special selections, highlights
- Focus ring: `pink-400`
- Border glow: `pink-400/50`

## Styling Details

### Glassmorphism Effect
```css
background: white/10
backdrop-blur: sm
border: 2px solid white/20
```

### Hover State
```css
background: white/15
border: white/30
Arrow color: cyan-400
```

### Focus State
```css
Ring: 2px solid cyan-400 (or variant color)
Border: cyan-400/50
Glow effect: gradient blur
```

### Option Styling
```css
background: slate-800
color: white
padding: 0.5rem 1rem
hover: gradient (cyan → violet)
```

## Advanced Examples

### With Error State
```tsx
<CustomSelect
  label="Required Field"
  error={formErrors.field ? "This field is required" : undefined}
  value={value}
  onChange={handleChange}
  variant="emerald"
>
  <option value="">Select...</option>
  <option value="1">Option 1</option>
</CustomSelect>
```

### Inline Select (No Full Width)
```tsx
<div className="flex items-center gap-2">
  <span>Sort by:</span>
  <CustomSelect
    fullWidth={false}
    variant="violet"
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
  >
    <option value="name">Name</option>
    <option value="date">Date</option>
  </CustomSelect>
</div>
```

### Multiple Selects in Grid
```tsx
<div className="grid grid-cols-2 gap-4">
  <SubjectSelect value={subject} onChange={handleSubjectChange}>
    <option value="">All Subjects</option>
    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
  </SubjectSelect>
  
  <ClassSelect value={classId} onChange={handleClassChange}>
    <option value="">All Classes</option>
    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
  </ClassSelect>
</div>
```

### Disabled State
```tsx
<CustomSelect
  label="Locked Field"
  disabled
  value={value}
>
  <option>Cannot change</option>
</CustomSelect>
```

## Global CSS Enhancements

The following CSS has been added to `globals.css` for enhanced select styling:

```css
/* Custom dropdown arrow */
select {
  appearance: none;
  background-image: url("data:image/svg+xml,<svg>...</svg>");
  background-position: right 0.75rem center;
  background-size: 1.25em 1.25em;
  padding-right: 2.75rem;
}

/* Hover state arrow */
select:hover {
  background-image: url("...cyan arrow...");
}

/* Focus state arrow */
select:focus {
  background-image: url("...cyan arrow...");
}

/* Option styling */
select option {
  background: rgb(15, 23, 42);
  color: white;
  transition: all 0.2s ease;
}

select option:hover,
select option:checked {
  background: linear-gradient(cyan → violet);
  color: cyan;
}

/* Focus animation */
select:focus-within {
  transform: translateY(-2px);
  box-shadow: glow effect;
}
```

## Browser Compatibility
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support (14+)
- ✅ Mobile browsers: Full support

## Accessibility Features
- Proper `label` association
- Focus visible states
- Keyboard navigation support
- Screen reader friendly
- ARIA attributes automatically inherited

## Migration Guide

### Old Style
```tsx
<select className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg">
  <option>Option</option>
</select>
```

### New Style
```tsx
<CustomSelect value={value} onChange={onChange}>
  <option>Option</option>
</CustomSelect>
```

### Benefits
- Consistent design across the app
- Automatic animations and effects
- Better accessibility
- Less code duplication
- Type safety

## Performance Notes
- Uses CSS transforms for animations (GPU accelerated)
- Backdrop blur is performant in modern browsers
- Transitions are optimized for 60fps
- No JavaScript for visual effects (pure CSS)

## Future Enhancements
- [ ] Multi-select support
- [ ] Search/filter functionality
- [ ] Custom option rendering
- [ ] Grouped options styling
- [ ] Keyboard shortcuts
- [ ] Virtual scrolling for large lists
