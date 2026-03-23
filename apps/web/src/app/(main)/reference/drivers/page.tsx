import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DriversReferencePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Справочник водителей</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Раздел ещё не готов и временно скрыт из навигации.
          </p>
          <Button asChild>
            <Link href="/reference">Вернуться к справочникам</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
