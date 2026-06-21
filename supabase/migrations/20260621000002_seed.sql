with
  weekend_trip as (
    insert into templates (name, owner_type)
    values ('Weekend Trip', 'system')
    returning id
  ),
  beach_holiday as (
    insert into templates (name, owner_type)
    values ('Beach Holiday', 'system')
    returning id
  ),
  business_trip as (
    insert into templates (name, owner_type)
    values ('Business Trip', 'system')
    returning id
  ),
  camping_trip as (
    insert into templates (name, owner_type)
    values ('Camping Trip', 'system')
    returning id
  ),
  template_item_rows as (
    select id as template_id, item, pos::integer as position
    from weekend_trip,
      unnest(array[
        'Clothes (2 days)', 'Underwear & socks', 'Toiletries bag',
        'Phone charger', 'Wallet & keys', 'Headphones', 'Book or e-reader'
      ]) with ordinality as t(item, pos)
    union all
    select id, item, pos::integer
    from beach_holiday,
      unnest(array[
        'Swimwear', 'Sunscreen', 'Beach towel', 'Sunglasses',
        'Sandals', 'Hat', 'After-sun lotion', 'Waterproof bag'
      ]) with ordinality as t(item, pos)
    union all
    select id, item, pos::integer
    from business_trip,
      unnest(array[
        'Laptop & charger', 'Work clothes', 'Phone charger', 'Toiletries bag',
        'Notebook & pen', 'Formal shoes', 'Business cards', 'Travel adaptor'
      ]) with ordinality as t(item, pos)
    union all
    select id, item, pos::integer
    from camping_trip,
      unnest(array[
        'Tent & pegs', 'Sleeping bag', 'Sleeping mat', 'Camp stove & fuel',
        'Cooking utensils', 'First aid kit', 'Torch & batteries',
        'Rain jacket', 'Hiking boots', 'Water bottle'
      ]) with ordinality as t(item, pos)
  )
insert into template_items (template_id, name, position)
select template_id, item, position from template_item_rows;

insert into library_items (name) values
  ('Clothes (2 days)'),
  ('Underwear & socks'),
  ('Toiletries bag'),
  ('Phone charger'),
  ('Wallet & keys'),
  ('Headphones'),
  ('Book or e-reader'),
  ('Swimwear'),
  ('Sunscreen'),
  ('Beach towel'),
  ('Sunglasses'),
  ('Sandals'),
  ('Hat'),
  ('After-sun lotion'),
  ('Waterproof bag'),
  ('Laptop & charger'),
  ('Work clothes'),
  ('Notebook & pen'),
  ('Formal shoes'),
  ('Business cards'),
  ('Travel adaptor'),
  ('Tent & pegs'),
  ('Sleeping bag'),
  ('Sleeping mat'),
  ('Camp stove & fuel'),
  ('Cooking utensils'),
  ('First aid kit'),
  ('Torch & batteries'),
  ('Rain jacket'),
  ('Hiking boots'),
  ('Water bottle'),
  ('Passport'),
  ('Travel insurance documents'),
  ('Umbrella'),
  ('Camera'),
  ('Cash'),
  ('Medication'),
  ('Earplugs'),
  ('Sleep mask'),
  ('Flip flops'),
  ('Snacks');
