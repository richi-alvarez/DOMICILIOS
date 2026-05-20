import { CatalogWizard } from '@/components/app/catalog-wizard'

interface Props {
  userName: string
}

export function OnboardingWizard({ userName }: Props) {
  return <CatalogWizard userName={userName} />
}
