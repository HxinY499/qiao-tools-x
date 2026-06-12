import { Check, History, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { useUUIDStore } from './store';

function UUIDGeneratorPage() {
  const { t } = useTranslation('tools');
  const [quantity, setQuantity] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [generatedContent, setGeneratedContent] = useState('');

  const { history, addHistory, clearHistory, removeHistoryItem } = useUUIDStore();

  const generateUUIDs = () => {
    const uuids: string[] = [];
    for (let i = 0; i < quantity; i++) {
      let uuid = crypto.randomUUID() as string;

      if (!hyphens) {
        uuid = uuid.replace(/-/g, '');
      }

      if (uppercase) {
        uuid = uuid.toUpperCase();
      }

      uuids.push(uuid);
    }

    const content = uuids.join('\n');
    setGeneratedContent(content);
    addHistory(uuids);

    toast.success(t('uuidGenerator.toast.generated', { count: quantity }));
  };

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              {t('uuidGenerator.config.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('uuidGenerator.config.quantity', { count: quantity })}</Label>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[quantity]}
                  onValueChange={(v) => setQuantity(v[0])}
                  min={1}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= 100) {
                      setQuantity(val);
                    }
                  }}
                  className="w-20"
                  min={1}
                  max={100}
                />
              </div>
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="uppercase" className="flex flex-col space-y-1">
                <span>{t('uuidGenerator.config.uppercase')}</span>
                <span className="font-normal text-xs text-muted-foreground">
                  {t('uuidGenerator.config.uppercaseDesc')}
                </span>
              </Label>
              <Switch id="uppercase" checked={uppercase} onCheckedChange={setUppercase} />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="hyphens" className="flex flex-col space-y-1">
                <span>{t('uuidGenerator.config.hyphens')}</span>
                <span className="font-normal text-xs text-muted-foreground">
                  {t('uuidGenerator.config.hyphensDesc')}
                </span>
              </Label>
              <Switch id="hyphens" checked={hyphens} onCheckedChange={setHyphens} />
            </div>

            <Button className="w-full" onClick={generateUUIDs}>
              {t('uuidGenerator.config.generate')}
            </Button>
          </CardContent>
        </Card>

        {/* Result Panel */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                {t('uuidGenerator.result.title')}
              </span>
              <CopyButton
                text={generatedContent}
                mode="icon-text"
                variant="ghost"
                size="sm"
                disabled={!generatedContent}
                className="h-8 px-2 lg:px-3"
                onCopy={() => toast.success(t('uuidGenerator.toast.copied'))}
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[200px]">
            <Textarea
              value={generatedContent}
              readOnly
              placeholder={t('uuidGenerator.result.placeholder')}
              className="h-full min-h-[200px] font-mono text-sm resize-none bg-muted/30"
            />
          </CardContent>
        </Card>
      </div>

      {/* History Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History className="w-4 h-4" />
              {t('uuidGenerator.history.title')}
            </span>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('uuidGenerator.history.clear')}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">{t('uuidGenerator.history.empty')}</div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {history.map((batch) => (
                  <div key={batch.id} className="flex flex-col space-y-2 p-3 rounded-lg border bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(batch.timestamp).toLocaleString()} • {batch.uuids.length} {t('uuidGenerator.history.countSuffix')}
                      </span>
                      <div className="flex items-center gap-1">
                        <CopyButton
                          text={batch.uuids.join('\n')}
                          mode="icon"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          iconClassName="w-3.5 h-3.5"
                          onCopy={() => toast.success(t('uuidGenerator.toast.copied'))}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeHistoryItem(batch.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground line-clamp-2 break-all">
                      {batch.uuids.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default UUIDGeneratorPage;
