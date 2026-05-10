import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import RamadanStatsCharts from '../components/RamadanStatsCharts'
import { useRamadanCampaignStats } from '../hooks/useRamadanCampaignStats'

const Ramadan = () => {
  const {
    totalDonations,
    boxCount,
    percentToGoal,
    boxGoal,
    effectiveCostPerBox,
  } = useRamadanCampaignStats()

  return (
    <div className="min-h-screen bg-beige-100">
      <Navbar />

      <header className="border-b border-beige-300 bg-gradient-to-l from-olive-800 to-olive-700 pt-28 sm:pt-32 pb-8 sm:pb-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">حملة شنطة رمضان</h1>
          <p className="mt-2 text-sm text-beige-200/90">أرقام التبرعات المعتمدة والهدف</p>
        </div>
      </header>

      <section className="py-8 sm:py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <RamadanStatsCharts
            totalDonations={totalDonations}
            boxCount={boxCount}
            percentToGoal={percentToGoal}
            boxGoal={boxGoal}
            effectiveCostPerBox={effectiveCostPerBox}
          />
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Ramadan
