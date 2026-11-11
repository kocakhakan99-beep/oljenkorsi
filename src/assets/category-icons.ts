import bank from "./bank.svg";
import benefit from "./benefit.svg";
import boat from "./boat.svg";
import business from "./business.svg";
import car from "./car.svg";
import charity from "./charity.svg";
import clothing from "./clothing.svg";
import dining from "./dining.svg";
import education from "./education.svg";
import electricity from "./electricity.svg";
import entertainment from "./entertainment.svg";
import family from "./family.svg";
import food from "./food.svg";
import fuel from "./fuel.svg";
import gift from "./gift.svg";
import health from "./health.svg";
import hobby from "./hobby.svg";
import home from "./home.svg";
import insurance from "./insurance.svg";
import interest from "./interest.svg";
import land from "./land.svg";
import loan from "./loan.svg";
import medicine from "./medicine.svg";
import motorcycle from "./motorcycle.svg";
import other from "./other.svg";
import pension from "./pension.svg";
import pet from "./pet.svg";
import phone from "./phone.svg";
import portfolio from "./portfolio.svg";
import refund from "./refund.svg";
import rental from "./rental.svg";
import salary from "./salary.svg";
import savings from "./savings.svg";
import sideIncome from "./side-income.svg";
import subscription from "./subscription.svg";
import tax from "./tax.svg";
import transit from "./transit.svg";
import travel from "./travel.svg";
import valuables from "./valuables.svg";
import water from "./water.svg";
import wifi from "./wifi.svg";
import type { CategoryIconId } from "../domain/categories";

export const categoryIconSources: Record<CategoryIconId, string> = {
  salary,
  benefit,
  "side-income": sideIncome,
  pension,
  business,
  rental,
  refund,
  gift,
  home,
  electricity,
  water,
  insurance,
  food,
  dining,
  transit,
  car,
  health,
  medicine,
  phone,
  wifi,
  subscription,
  family,
  clothing,
  hobby,
  entertainment,
  pet,
  education,
  travel,
  charity,
  tax,
  loan,
  interest,
  savings,
  portfolio,
  bank,
  land,
  boat,
  motorcycle,
  valuables,
  fuel,
  other,
};
