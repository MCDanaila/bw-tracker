import { useParams } from 'react-router-dom';

export default function AthleteDetailPage() {
  const { id } = useParams();
  return <div className="space-y-6"><h1 className="text-2xl font-bold">Athlete Detail</h1><p className="text-muted-foreground">Athlete {id} - TODO</p></div>;
}
