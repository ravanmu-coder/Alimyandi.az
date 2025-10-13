import { useState } from 'react'
import { 
  Palette, 
  Type, 
  Layout, 
  MousePointer, 
  Info
} from 'lucide-react'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'
import { TagChip } from '../components/common/TagChip'
import { Avatar } from '../components/common/Avatar'
import { KPICard } from '../components/ui/KPICard'
import { TrendingUp, Users, Car, Gavel } from 'lucide-react'

export function StyleguidePage() {
  const [activeTab, setActiveTab] = useState('colors')

  const tabs = [
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'components', label: 'Components', icon: Layout },
    { id: 'interactions', label: 'Interactions', icon: MousePointer }
  ]

  const colorPalette = [
    { name: 'Dark Background Primary', value: '#0B1221', usage: 'Main backgrounds, primary surfaces' },
    { name: 'Dark Background Secondary', value: '#1E293B', usage: 'Cards, modals, elevated elements' },
    { name: 'Dark Background Tertiary', value: '#334155', usage: 'Hover states, active elements' },
    { name: 'Accent Primary (Teal)', value: '#14B8A6', usage: 'Primary actions, links, highlights' },
    { name: 'Accent Secondary (Blue)', value: '#38BDF8', usage: 'Secondary actions, info states' },
    { name: 'Text Primary', value: '#F8FAFC', usage: 'Headings, important text' },
    { name: 'Text Secondary', value: '#CBD5E1', usage: 'Body text, descriptions' },
    { name: 'Text Muted', value: '#94A3B8', usage: 'Captions, labels, disabled text' },
    { name: 'Success', value: '#10B981', usage: 'Success states, positive feedback' },
    { name: 'Warning', value: '#F59E0B', usage: 'Warning states, caution' },
    { name: 'Error', value: '#EF4444', usage: 'Error states, destructive actions' },
    { name: 'Info', value: '#3B82F6', usage: 'Information states, neutral actions' }
  ]

  const typographyExamples = [
    { level: 'H1', class: 'text-h1', example: 'Dashboard Overview' },
    { level: 'H2', class: 'text-h2', example: 'Recent Activity' },
    { level: 'H3', class: 'text-h3', example: 'Section Headers' },
    { level: 'H4', class: 'text-h4', example: 'Card Titles' },
    { level: 'Body Large', class: 'text-body-lg', example: 'This is large body text for important content areas.' },
    { level: 'Body Medium', class: 'text-body-md', example: 'This is regular body text for content areas.' },
    { level: 'Body Small', class: 'text-body-sm', example: 'This is smaller text for captions and labels.' },
    { level: 'Body Extra Small', class: 'text-body-xs', example: 'This is extra small text for metadata.' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h1 font-heading text-dark-text-primary mb-2">Style Guide</h1>
        <p className="text-body-md text-dark-text-secondary">Design system components and guidelines for Əlimyandi.az Admin Panel</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-dark-border">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-body font-medium text-body-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-dark-text-muted hover:text-dark-text-secondary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Colors */}
        {activeTab === 'colors' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-h2 font-heading text-dark-text-primary mb-4">Color Palette</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {colorPalette.map((color) => (
                  <div key={color.name} className="bg-dark-bg-secondary rounded-xl shadow-dark border border-dark-border p-4">
                    <div 
                      className="w-full h-20 rounded-xl mb-3 border border-dark-border"
                      style={{ backgroundColor: color.value }}
                    />
                    <h3 className="font-heading font-medium text-dark-text-primary mb-1">{color.name}</h3>
                    <p className="text-body-sm text-dark-text-muted mb-2 font-mono">{color.value}</p>
                    <p className="text-body-xs text-dark-text-muted">{color.usage}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-h3 font-heading text-dark-text-primary mb-4">Status Colors</h3>
              <div className="flex flex-wrap gap-4">
                <Badge variant="success">Success</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="neutral">Neutral</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Typography */}
        {activeTab === 'typography' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-h2 font-heading text-dark-text-primary mb-4">Typography Scale</h2>
              <div className="space-y-6">
                {typographyExamples.map((example) => (
                  <div key={example.level} className="bg-dark-bg-secondary rounded-xl shadow-dark border border-dark-border p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-body-sm font-medium text-dark-text-muted">{example.level}</span>
                      <span className="text-body-xs font-mono text-dark-text-muted">{example.class}</span>
                    </div>
                    <div className={`${example.class} font-heading`}>
                      {example.example}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-h3 font-heading text-dark-text-primary mb-4">Font Families</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-dark-bg-secondary rounded-xl shadow-dark border border-dark-border p-6">
                  <h4 className="font-heading font-medium text-dark-text-primary mb-2">Headings - Poppins</h4>
                  <p className="text-body-sm text-dark-text-secondary mb-2">Used for all headings and titles</p>
                  <div className="font-heading text-body-lg text-dark-text-primary">Əlimyandi.az Admin Panel</div>
                </div>
                <div className="bg-dark-bg-secondary rounded-xl shadow-dark border border-dark-border p-6">
                  <h4 className="font-heading font-medium text-dark-text-primary mb-2">Body - Inter</h4>
                  <p className="text-body-sm text-dark-text-secondary mb-2">Used for all body text and UI elements</p>
                  <div className="font-body text-body-lg text-dark-text-primary">The quick brown fox jumps over the lazy dog</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Components */}
        {activeTab === 'components' && (
          <div className="space-y-8">
            {/* Buttons */}
            <div>
              <h2 className="text-h2 font-heading text-dark-text-primary mb-4">Buttons</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-h3 font-heading text-dark-text-primary mb-3">Button Variants</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="danger">Danger</Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-h3 font-heading text-dark-text-primary mb-3">Button Sizes</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary" size="sm">Small</Button>
                    <Button variant="primary" size="md">Medium</Button>
                    <Button variant="primary" size="lg">Large</Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-h3 font-heading text-dark-text-primary mb-3">Button States</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Normal</Button>
                    <Button variant="primary" loading>Loading</Button>
                    <Button variant="primary" disabled>Disabled</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div>
              <h2 className="text-h2 font-heading text-dark-text-primary mb-4">Badges</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-h3 font-heading text-dark-text-primary mb-3">Badge Variants</h3>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="success">Success</Badge>
                    <Badge variant="danger">Danger</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="info">Info</Badge>
                    <Badge variant="neutral">Neutral</Badge>
                  </div>
                </div>
                <div>
                  <h3 className="text-h3 font-heading text-dark-text-primary mb-3">Badge Sizes</h3>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="success" size="sm">Small</Badge>
                    <Badge variant="success" size="md">Medium</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h2 className="text-h2 font-heading text-dark-text-primary mb-4">Tag Chips</h2>
              <div className="flex flex-wrap gap-3">
                <TagChip label="Toyota" />
                <TagChip label="BMW" />
                <TagChip label="Mercedes" variant="primary" />
                <TagChip label="Audi" variant="secondary" />
                <TagChip label="Removable" onRemove={() => {}} />
              </div>
            </div>

            {/* Avatars */}
            <div>
              <h2 className="text-h2 font-heading text-dark-text-primary mb-4">Avatars</h2>
              <div className="flex items-center space-x-4">
                <Avatar fallback="AU" size="sm" />
                <Avatar fallback="AU" size="md" />
                <Avatar fallback="AU" size="lg" />
                <Avatar fallback="AU" size="xl" />
              </div>
            </div>

            {/* KPI Cards */}
            <div>
              <h2 className="text-h2 font-heading text-dark-text-primary mb-4">KPI Cards</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                  title="Total Revenue"
                  value="$2,847,392"
                  subtitle="This month"
                  icon={TrendingUp}
                  trend={{ value: 12.5, isPositive: true, label: "vs last month" }}
                />
                <KPICard
                  title="Active Users"
                  value="8,429"
                  subtitle="Currently online"
                  icon={Users}
                  trend={{ value: 5.7, isPositive: true, label: "vs last month" }}
                />
                <KPICard
                  title="Vehicles"
                  value="1,247"
                  subtitle="In inventory"
                  icon={Car}
                  trend={{ value: 3.1, isPositive: true, label: "vs last month" }}
                />
                <KPICard
                  title="Auctions"
                  value="24"
                  subtitle="Currently running"
                  icon={Gavel}
                  trend={{ value: 8.2, isPositive: true, label: "vs last week" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Interactions */}
        {activeTab === 'interactions' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-h2 font-heading text-dark-text-primary mb-4">Interactive States</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-h3 font-heading text-dark-text-primary mb-3">Hover Effects</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-dark-bg-secondary rounded-xl shadow-dark border border-dark-border p-6 group cursor-pointer hover:shadow-dark-lg transition-all duration-200">
                      <h4 className="font-heading font-medium text-dark-text-primary group-hover:text-accent-primary transition-colors duration-200">
                        Card Hover Effect
                      </h4>
                      <p className="text-body-sm text-dark-text-secondary mt-2">
                        Hover over this card to see the elevation and color transition effects.
                      </p>
                    </div>
                    <div className="bg-dark-bg-secondary rounded-xl shadow-dark border border-dark-border p-6 group cursor-pointer hover:shadow-dark-lg transition-all duration-200">
                      <h4 className="font-heading font-medium text-dark-text-primary group-hover:text-accent-primary transition-colors duration-200">
                        Standard Card
                      </h4>
                      <p className="text-body-sm text-dark-text-secondary mt-2">
                        This card has a subtle hover effect with color transition.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-h3 font-heading text-dark-text-primary mb-3">Focus States</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Focus on this input to see the focus ring"
                      className="w-full px-4 py-2 bg-dark-bg-secondary border border-dark-border rounded-xl text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary"
                    />
                    <Button variant="primary">Focus me</Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-h3 font-heading text-dark-text-primary mb-3">Loading States</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" loading>Loading Button</Button>
                    <div className="bg-dark-bg-secondary rounded-xl shadow-dark border border-dark-border p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-dark-bg-tertiary rounded mb-2"></div>
                        <div className="h-4 bg-dark-bg-tertiary rounded mb-2 w-3/4"></div>
                        <div className="h-4 bg-dark-bg-tertiary rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-h3 font-heading text-dark-text-primary mb-3">Empty States</h3>
                  <div className="bg-dark-bg-secondary rounded-xl shadow-dark border border-dark-border text-center py-12">
                    <div className="w-16 h-16 bg-dark-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Info className="w-8 h-8 text-dark-text-muted" />
                    </div>
                    <h4 className="text-h4 font-heading text-dark-text-primary mb-2">No Data Available</h4>
                    <p className="text-body-md text-dark-text-secondary mb-6 max-w-md mx-auto">
                      This is an example of an empty state with an icon, title, and description.
                    </p>
                    <Button variant="primary" disabled>Add New Item</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
