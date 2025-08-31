import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronsUpDown, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const OrganizationCombobox = ({ selectedValue, onSelect, allOrgs, placeholder }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const selectedOrgName = allOrgs.find(org => String(org.id) === String(selectedValue))?.name || "";

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedValue ? selectedOrgName : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder={t('organizations_page.search_placeholder', 'Search organization...')} />
          <CommandList>
            <CommandEmpty>{t('organizations_page.no_orgs_found', 'No organization found.')}</CommandEmpty>
            <CommandGroup>
              {allOrgs.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.name}
                  onSelect={(currentValue) => {
                    const selectedOrg = allOrgs.find(o => o.name.toLowerCase() === currentValue.toLowerCase());
                    if (selectedOrg) {
                      onSelect(String(selectedOrg.id));
                    }
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      String(selectedValue) === String(org.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {org.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default OrganizationCombobox;