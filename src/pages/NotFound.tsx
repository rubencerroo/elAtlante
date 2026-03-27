import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <SEO title="404 - Página no encontrada" description="Lo sentimos, no hemos podido encontrar la página que buscas en El Atlante de San Cristóbal." />
      <h1 className="text-9xl font-black text-primary/20">404</h1>
      <h2 className="text-3xl font-bold mt-4 text-slate-800 dark:text-slate-100">Página no encontrada</h2>
      <p className="text-slate-500 mt-4 max-w-md">
        Lo sentimos, no hemos podido encontrar la página que buscas. Es posible que haya sido movida o eliminada.
      </p>
      <Link 
        to="/" 
        className="mt-8 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg hover:shadow-xl active:scale-95 uppercase tracking-wider text-sm"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
