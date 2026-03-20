import SEO from '../components/SEO';
import { useTranslation } from 'react-i18next';
import { CONTACT_INFO } from '../constants/contact';

export default function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen pt-28 pb-24 px-6 lg:px-28 flex flex-col items-center bg-white dark:bg-slate-950 relative overflow-hidden">
      <SEO 
        title={t('privacy.seoTitle')}
        description={t('privacy.seoDescription')}
        canonical="/privacidad"
      />
      {/* Background Decor ... existing code ... */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] -z-10"></div>

      <div className="max-w-3xl w-full relative z-10">
        <header className="mb-16">
          <span className="text-primary dark:text-sky-400 font-bold tracking-[0.4em] uppercase text-[10px]">{t('privacy.headerLabel')}</span>
          <h1 className="text-slate-900 dark:text-slate-100 text-3xl md:text-4xl lg:text-5xl font-black mt-4 tracking-tight leading-tight">
            {t('privacy.title1')} <span className="text-primary dark:text-sky-400 italic">{t('privacy.title2')}</span>
          </h1>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-600 dark:text-slate-400 font-light leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('privacy.section1.title')}</h2>
            <p>
              {t('privacy.section1.p1')}{CONTACT_INFO.landline.display} {t('privacy.fijo')} {t('privacy.y')} {CONTACT_INFO.mobile.display} {t('privacy.movil')}.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('privacy.section2.title')}</h2>
            <p>
              {t('privacy.section2.p1')}
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>{t('privacy.section2.li1Label')}</strong> {t('privacy.section2.li1Desc')}</li>
              <li><strong>{t('privacy.section2.li2Label')}</strong> {t('privacy.section2.li2Desc')}</li>
              <li><strong>{t('privacy.section2.li3Label')}</strong> {t('privacy.section2.li3Desc')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('privacy.section3.title')}</h2>
            <p>
              {t('privacy.section3.p1')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('privacy.section4.title')}</h2>
            <p>
              {t('privacy.section4.p1')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('privacy.section5.title')}</h2>
            <p>
              {t('privacy.section5.p1')}
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
