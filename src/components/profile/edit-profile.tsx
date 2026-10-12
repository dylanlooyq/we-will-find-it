"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { cn } from "@/lib/cn";
import { areas } from "@/lib/data/taxonomy";
import { fileToDataUrl } from "@/lib/images-client";
import { actions } from "@/lib/store/store";
import { toast } from "@/lib/store/events";
import type { User } from "@/lib/types";
import { UserAvatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { SelectField, TextArea, TextField } from "../ui/form";
import { Overlay } from "../ui/overlay";

const HUES = [14, 38, 120, 168, 210, 250, 280, 330];

export function EditProfileDialog({ open, onClose, user }: { open: boolean; onClose: () => void; user: User }) {
  const [name, setName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle);
  const [bio, setBio] = useState(user.bio);
  const [area, setArea] = useState(user.homeArea);
  const [hue, setHue] = useState(user.hue);
  const [avatar, setAvatar] = useState<string | undefined>(user.avatarSrc);
  const file = useRef<HTMLInputElement>(null);
  const preview = { ...user, name: name || user.name, hue, avatarSrc: avatar };

  const save = () => {
    actions.updateProfile({ name: name.trim() || user.name, handle, bio: bio.trim(), homeArea: area, hue, avatarSrc: avatar });
    toast("Profile updated", { tone: "success" });
    onClose();
  };

  return (
    <Overlay open={open} onClose={onClose} title="Edit profile" description={user.profileComplete ? undefined : "Complete your profile to earn +10 points and the Verified badge."}>
      <div className="mt-5 space-y-5">
        <div className="flex items-center gap-4">
          <UserAvatar user={preview} size="xl" />
          <div className="space-y-2.5">
            <input
              ref={file}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Upload profile photo"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setAvatar(await fileToDataUrl(f, 320, 0.8));
              }}
            />
            <Button size="sm" variant="secondary" onClick={() => file.current?.click()} iconLeft={<Camera className="size-4" aria-hidden />}>
              Upload photo
            </Button>
            <div role="radiogroup" aria-label="Avatar colour" className="flex flex-wrap gap-1.5">
              {HUES.map((h) => (
                <button
                  key={h}
                  type="button"
                  role="radio"
                  aria-checked={hue === h && !avatar}
                  aria-label={`Colour ${h}`}
                  onClick={() => {
                    setHue(h);
                    setAvatar(undefined);
                  }}
                  className={cn("size-7 rounded-full ring-offset-2 transition", hue === h && !avatar ? "ring-2 ring-navy-900" : "ring-0")}
                  style={{ backgroundImage: `linear-gradient(135deg, hsl(${h} 62% 48%), hsl(${(h + 38) % 360} 66% 38%))` }}
                />
              ))}
            </div>
          </div>
        </div>
        <TextField label="Display name" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} hint="First name and last initial works well — e.g. John S." />
        <TextField label="Username" value={handle} onChange={(e) => setHandle(e.target.value)} prefix={<span className="text-sm font-bold">@</span>} maxLength={24} />
        <SelectField label="Home area" value={area} onChange={(e) => setArea(e.target.value as typeof area)}>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </SelectField>
        <TextArea label="About me" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={160} placeholder="A line or two so people know who they're talking to." />
        <div className="flex gap-3">
          <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button size="lg" className="flex-1" onClick={save}>
            Save changes
          </Button>
        </div>
      </div>
    </Overlay>
  );
}
