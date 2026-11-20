import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudio } from "@/hooks/useAudio";

const AudioControls = () => {
  const { settings, toggleAudio, setVolume, playButtonClick } = useAudio();

  return (
    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/70 p-1.5 shadow-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          playButtonClick();
          toggleAudio();
        }}
        className="h-8 w-8 rounded-full p-0"
        aria-label={settings.enabled ? "Mute audio" : "Enable audio"}
      >
        {settings.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </Button>

      {settings.enabled && (
        <div className="flex items-center gap-2 pr-2">
          <Slider
            value={[settings.volume]}
            onValueChange={(value) => setVolume(value[0])}
            max={1}
            min={0}
            step={0.1}
            className="w-12 sm:w-16"
            aria-label="Audio volume"
          />
          <span className="w-8 text-xs tabular-nums text-muted-foreground">
            {Math.round(settings.volume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default AudioControls;
